export const meta = {
  name: 'implement-graph',
  description: 'Run plan phases as a dependency graph: ready phases in parallel worktrees, merged per layer; irreversible phases held for human approval',
  whenToUse: 'Phase D of development-workflow when the plan graph (plan_graph.py) has independent phases',
  phases: [
    { title: 'Implement', detail: 'implement-lead runs the per-phase loop for one phase' },
    { title: 'Merge', detail: 'merge green phase branches, rerun tests' },
  ],
}

// args: { graph: <plan_graph.py output>, designDir, researchDoc, workdir, standards,
//         done?: [phase ids already committed], approved?: [irreversible phase ids the human approved],
//         dryRun?: boolean }
const { graph, designDir, researchDoc, workdir, standards } = args
const done = new Set(args.done || [])
const approved = new Set(args.approved || [])
if (!graph || !Array.isArray(graph.phases)) throw new Error('args.graph must be the JSON output of plan_graph.py')

const byId = Object.fromEntries(graph.phases.map(p => [p.id, p]))
const state = {} // id -> done | failed | held
done.forEach(id => { state[id] = 'done' })
const failed = [], held = [], constraints = [], layersRun = []

const UNIT = {
  type: 'object',
  properties: {
    phase: { type: 'string' },
    verdict: { type: 'string', enum: ['green', 'red', 'escalated'] },
    branch: { type: 'string', description: 'git rev-parse --abbrev-ref HEAD after committing' },
    commit: { type: 'string', description: 'phase commit sha, empty if not committed' },
    summary: { type: 'string', description: 'one line: what was built, or why it stopped' },
    constraint: {
      type: 'object',
      description: 'learning edge; include only if the phase needed a correction or a reviewer confirmed a non-obvious rule',
      properties: { accepted: { type: 'string' }, derived: { type: 'string' }, evidence: { type: 'string' } },
      required: ['accepted', 'derived', 'evidence'],
    },
  },
  required: ['phase', 'verdict', 'branch', 'commit', 'summary'],
}
const MERGE = {
  type: 'object',
  properties: {
    merged: { type: 'array', items: { type: 'string' } },
    conflicts: { type: 'array', items: { type: 'object', properties: { phase: { type: 'string' }, detail: { type: 'string' } }, required: ['phase', 'detail'] } },
    testsGreen: { type: 'boolean' },
    testOutput: { type: 'string', description: 'last lines of the test run' },
  },
  required: ['merged', 'conflicts', 'testsGreen'],
}

const unitPrompt = p => `Execute ONLY phase ${p.id} of the plan: ${p.file}
Design docs: ${designDir}
Research doc: ${researchDoc}
Working directory: the current directory (repo root${workdir ? `; main checkout is ${workdir}` : ''})
Standards: ${standards || 'see plan'}
Lane: ${p.lane}${p.lane === 'irreversible' ? ' — the human has already approved this phase; commit when every gate is green' : ''}
Completed phases already in this branch: ${Object.keys(state).filter(id => state[id] === 'done').join(', ') || 'none'}

Run your full per-phase loop (coder → deterministic gates incl. scope gate → reviewers → merge_verdicts → fix loop).
Rules for this run:
- Do not start any other phase.
- Commit the phase on the current branch using the Coder's explicit file list.
- Do NOT write docs/constraints.md. Return the learning-edge entry in "constraint" instead.
- If you would escalate to a human, stop and return verdict "escalated" with the reason in summary.`

let layer = 0
while (true) {
  const ready = graph.phases.filter(p => !state[p.id] && p.deps.every(d => state[d] === 'done'))
  if (!ready.length) break
  const runnable = []
  for (const p of ready) {
    if (p.lane === 'irreversible' && !approved.has(p.id)) { state[p.id] = 'held'; held.push(p.id) }
    else runnable.push(p)
  }
  if (!runnable.length) continue
  layer++
  layersRun.push(runnable.map(p => p.id))
  log(`Layer ${layer}: phases ${runnable.map(p => p.id).join(', ')}${held.length ? ` (held for approval: ${held.join(', ')})` : ''}`)
  if (args.dryRun) { runnable.forEach(p => { state[p.id] = 'done' }); continue }

  // One phase: run in the main checkout, no merge needed. Several: isolate each in a worktree.
  const isolate = runnable.length > 1
  const results = await parallel(runnable.map(p => () =>
    agent(unitPrompt(p), {
      agentType: 'development-workflow:implement-lead',
      schema: UNIT,
      phase: 'Implement',
      label: `phase ${p.id} (${p.lane})`,
      ...(isolate ? { isolation: 'worktree' } : {}),
    })))

  const green = []
  runnable.forEach((p, i) => {
    const r = results[i]
    if (r && r.constraint) constraints.push({ phase: p.id, ...r.constraint })
    if (r && r.verdict === 'green' && r.commit) green.push({ p, r })
    else { state[p.id] = 'failed'; failed.push({ phase: p.id, reason: r ? `${r.verdict}: ${r.summary}` : 'agent died or was skipped' }) }
  })

  if (!isolate) { green.forEach(({ p }) => { state[p.id] = 'done' }); continue }
  if (!green.length) continue

  const m = await agent(
    `In the main checkout${workdir ? ` (${workdir})` : ''}, merge these phase branches one at a time, in this order, with "git merge --no-ff <branch>":
${green.map(({ p, r }) => `- phase ${p.id}: branch ${r.branch} (commit ${r.commit})`).join('\n')}
Report "merged" and each conflict's "phase" as the bare phase id (e.g. "02").
If a merge conflicts, run "git merge --abort", record the conflict, and continue with the next branch. Do not resolve conflicts yourself.
After all merges, run the test suite once (${standards || 'use the test command from the plan'}) and report the result.
Do not edit any file.`,
    { schema: MERGE, phase: 'Merge', label: `merge layer ${layer}`, effort: 'low' })

  const merged = new Set(m ? m.merged : [])
  for (const { p } of green) {
    const hit = merged.has(p.id)
    if (hit && m.testsGreen) state[p.id] = 'done'
    else {
      state[p.id] = 'failed'
      const c = m && m.conflicts.find(c => c.phase === p.id)
      failed.push({ phase: p.id, reason: c ? `merge conflict: ${c.detail}` : m && !m.testsGreen ? `tests red after merge: ${m.testOutput || ''}` : 'not merged' })
    }
  }
}

const blocked = graph.phases.filter(p => !state[p.id]).map(p => p.id)
if (blocked.length) log(`Blocked behind held or failed phases: ${blocked.join(', ')}`)
return {
  completed: graph.phases.filter(p => state[p.id] === 'done').map(p => p.id),
  layers: layersRun,
  failed,
  heldForApproval: held.map(id => ({ phase: id, file: byId[id].file })),
  blocked,
  constraints,
}
