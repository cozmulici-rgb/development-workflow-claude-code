export const meta = {
  name: 'implement-graph',
  description: 'Run plan phases as a dependency graph: each phase runs coder → deterministic gates → parallel reviewers → fix loop; ready phases run in parallel worktrees, merged per layer; irreversible phases held for approval',
  whenToUse: 'Phase D of development-workflow when the plan graph (plan_graph.py) has independent phases',
  phases: [
    { title: 'Code', detail: 'implement-coder builds or fixes one phase' },
    { title: 'Gates', detail: 'build, tests, lint, scope gate — exit codes only' },
    { title: 'Review', detail: 'reviewers and tester in parallel, structured verdicts' },
    { title: 'Merge', detail: 'merge green phase branches, rerun tests' },
  ],
}

// args: { graph: <plan_graph.py output>, workdir (absolute, required), designDir, researchDoc, standards,
//         pluginRoot (absolute), fintech?: boolean, done?: [ids], approved?: [irreversible ids approved by the human], dryRun?: boolean }
const { graph, workdir, standards } = args
if (!graph || !Array.isArray(graph.phases)) throw new Error('args.graph must be the JSON output of plan_graph.py')
if (!workdir || !workdir.startsWith('/')) throw new Error('args.workdir must be the absolute path of the main checkout')
if (!args.dryRun && !args.pluginRoot) throw new Error('args.pluginRoot must be the absolute path of the development-workflow plugin')
// Plan/design/research docs may be untracked (e.g. a global gitignore on docs/), so worktrees may not have them.
// Always point agents at the main checkout.
const abs = p => (!p ? p : p.startsWith('/') ? p : `${workdir}/${p}`)
const designDir = abs(args.designDir), researchDoc = abs(args.researchDoc)
const done = new Set(args.done || []), approved = new Set(args.approved || [])
const byId = Object.fromEntries(graph.phases.map(p => [p.id, p]))

// Models sometimes return '""' for an empty string field
const said = t => typeof t === 'string' && !/^["'\s]*$/.test(t)
const MAX_GATE_ATTEMPTS = 3, MAX_REVIEW_ROUNDS = 2
const REVIEWERS = ['reviewer-quality', 'reviewer-architecture', 'reviewer-security', 'reviewer-plan-compliance', 'tester']
  .concat(args.fintech ? ['reviewer-fintech-compliance', 'reviewer-fintech-patterns'] : [])
const SAFETY = `If a hook, permission rule, or safety check refuses a command, do not work around it — no alternate binaries (e.g. /usr/bin/git), paths, or wrappers. Stop and report the refusal verbatim.`

const CODER = {
  type: 'object',
  properties: {
    worktree: { type: 'string', description: 'absolute path of the checkout you worked in (pwd)' },
    base: { type: 'string', description: 'first run only: sha of HEAD before you changed anything' },
    branch: { type: 'string', description: 'git rev-parse --abbrev-ref HEAD' },
    commit: { type: 'string', description: 'sha of your commit, empty if you did not commit' },
    files: { type: 'array', items: { type: 'string' }, description: 'files you created, modified, or deleted' },
    blocked: { type: 'string', description: 'why you could not proceed (refused command, plan gap); empty string "" if you completed the work' },
    derivedRule: { type: 'string', description: 'fix rounds only: a rule about the CODE or the PLAN that the fix proved, which the next plan should follow. Never about tools, harness, permissions, or environment. Empty if none.' },
  },
  required: ['worktree', 'branch', 'commit', 'files', 'blocked'],
}
const GATES = {
  type: 'object',
  properties: {
    checks: { type: 'array', items: { type: 'object', properties: {
      name: { type: 'string' }, command: { type: 'string' }, exitCode: { type: 'integer' }, tail: { type: 'string', description: 'last 20 lines of output' },
    }, required: ['name', 'command', 'exitCode', 'tail'] } },
    refused: { type: 'boolean', description: 'true only if a hook or permission rule refused a command' },
    refusal: { type: 'string', description: 'the refusal message, verbatim, when refused is true' },
  },
  required: ['checks', 'refused'],
}
const VERDICTS = {
  type: 'object',
  properties: {
    verdicts: { type: 'array', items: { type: 'object', properties: {
      unit: { type: 'string' }, verdict: { type: 'string', enum: ['green', 'red'] },
      severity: { type: 'string', enum: ['critical', 'must-fix', 'should-fix', 'suggestion', 'none'] },
      reason: { type: 'string' }, evidence: { type: 'string', description: 'file:line, test name, or command output line' },
      scope: { type: 'string', description: 'files the fix may touch' },
    }, required: ['unit', 'verdict', 'severity', 'reason', 'evidence', 'scope'] } },
  },
  required: ['verdicts'],
}
const MERGE = {
  type: 'object',
  properties: {
    merged: { type: 'array', items: { type: 'string' }, description: 'bare phase ids, e.g. "02"' },
    conflicts: { type: 'array', items: { type: 'object', properties: { phase: { type: 'string' }, detail: { type: 'string' } }, required: ['phase', 'detail'] } },
    testsGreen: { type: 'boolean' },
    testOutput: { type: 'string' },
  },
  required: ['merged', 'conflicts', 'testsGreen'],
}

const context = p => `Phase plan: ${abs(p.file)}
Design docs: ${designDir}
Research doc: ${researchDoc}
Standards: ${standards || 'see plan'}
Plan, design and research docs live in the main checkout (${workdir}); read them from there.`

// Code node: merge verdicts — dedupe by evidence+reason, rank by severity (replaces merge_verdicts.py here)
const RANK = { critical: 0, 'must-fix': 1, 'should-fix': 2, suggestion: 3, none: 4 }
function mergeVerdicts(all) {
  const seen = new Set(), red = []
  for (const v of all) {
    const k = `${v.evidence}|${v.reason}`.toLowerCase()
    if (v.verdict === 'red' && !seen.has(k)) { seen.add(k); red.push(v) }
  }
  return red.sort((a, b) => (RANK[a.severity] ?? 1) - (RANK[b.severity] ?? 1))
}
const checklist = red => red.map((v, i) => `${i + 1}. [${v.severity}] ${v.unit}: ${v.reason}\n   evidence: ${v.evidence} | fix only: ${v.scope}`).join('\n')

async function runGates(p, where, base, tag) {
  const g = await agent(
    `cd ${where} and run these checks. Report each command's exit code and output tail. Do not edit, fix, or commit anything.
1. Build/compile, tests, lint, static analysis per standards: ${standards || 'use the commands in the phase plan'}
2. Scope gate: python3 "${args.pluginRoot}/skills/pipeline-gates/check_scope.py" ${abs(p.file)} ${base}
${SAFETY}`,
    { schema: GATES, phase: 'Gates', label: `gates ${p.id}${tag}`, effort: 'low' })
  if (!g) return { ok: false, report: 'gate runner died' }
  if (g.refused === true) return { ok: false, refused: g.refusal || 'refused (no message)', report: g.refusal || '' }
  const failed = g.checks.filter(c => c.exitCode !== 0)
  return { ok: failed.length === 0, report: failed.map(c => `${c.name} (${c.command}) exit ${c.exitCode}\n${c.tail}`).join('\n\n') }
}

async function runPhase(p, isolate) {
  const tag = isolate ? ' (worktree)' : ''
  let c = await agent(
    `Implement phase ${p.id} exactly as planned.
${context(p)}
Lane: ${p.lane}
Before changing anything, record "git rev-parse HEAD" as base.
When done: run the phase's tests once, then commit ONLY the files you created/modified/deleted (explicit git add list, never -A) with message "feat: phase ${p.id} — <objective>".
Report pwd as worktree.
${SAFETY}`,
    { agentType: 'development-workflow:implement-coder', schema: CODER, phase: 'Code', label: `code ${p.id}${tag}`, ...(isolate ? { isolation: 'worktree' } : {}) })
  if (!c) return { phase: p.id, verdict: 'escalated', summary: 'coder died or was skipped' }
  if (said(c.blocked)) return { phase: p.id, verdict: 'escalated', summary: `coder blocked: ${c.blocked}`, branch: c.branch }
  const where = c.worktree || workdir
  const base = c.base
  const fix = async (items, why) => {
    const f = await agent(
      `cd ${where}. Fix ONLY these items for phase ${p.id} (${why}). Touch only the files named in each item's scope. Do not change anything that is not listed.
${items}
${context(p)}
Commit the fix (explicit file list) with message "fix: phase ${p.id} — ${why}". Report pwd as worktree.
${SAFETY}`,
      { agentType: 'development-workflow:implement-coder', schema: CODER, phase: 'Code', label: `fix ${p.id}${tag}` })
    return f
  }

  // Deterministic gates first
  let gates, attempt = 0
  while (true) {
    gates = await runGates(p, where, base, tag)
    if (gates.ok) break
    if (gates.refused) return { phase: p.id, verdict: 'escalated', summary: `command refused: ${gates.refused}`, branch: c.branch }
    if (++attempt >= MAX_GATE_ATTEMPTS) return { phase: p.id, verdict: 'escalated', summary: `gates red after ${attempt} attempts:\n${gates.report}`, branch: c.branch }
    const f = await fix(gates.report, 'failing gates')
    if (!f || said(f.blocked)) return { phase: p.id, verdict: 'escalated', summary: `fix blocked: ${f ? f.blocked : 'coder died'}`, branch: c.branch }
    c = { ...c, ...f }
  }

  // Parallel reviewers; only red ones re-run after a fix. Return the unit, not the batch.
  let pending = REVIEWERS, rounds = 0, derived = []
  while (pending.length) {
    const results = await parallel(pending.map(r => () => agent(
      `Review phase ${p.id} in ${where}. Diff: git -C ${where} diff ${base}..HEAD
${context(p)}
Return one verdict per finding (unit = "${r}: phase ${p.id}"), or a single green verdict if there are none. Every red verdict needs evidence.
Do not edit code. ${SAFETY}`,
      { agentType: `development-workflow:${r}`, schema: VERDICTS, phase: 'Review', label: `${r} ${p.id}` })))
    const all = results.flatMap((res, i) => res ? res.verdicts : [{ unit: pending[i], verdict: 'red', severity: 'must-fix', reason: 'reviewer returned no verdict', evidence: '-', scope: '-' }])
    const red = mergeVerdicts(all)
    if (!red.length) break
    if (rounds++ >= MAX_REVIEW_ROUNDS) return { phase: p.id, verdict: 'escalated', summary: `still red after ${MAX_REVIEW_ROUNDS} fix rounds (the plan may be wrong):\n${checklist(red)}`, branch: c.branch }
    const f = await fix(checklist(red), 'review findings')
    if (!f || said(f.blocked)) return { phase: p.id, verdict: 'escalated', summary: `fix blocked: ${f ? f.blocked : 'coder died'}`, branch: c.branch }
    c = { ...c, ...f }
    if (said(f.derivedRule)) derived.push({ rule: f.derivedRule, evidence: red.map(v => v.evidence).join('; ') })
    gates = await runGates(p, where, base, tag)
    if (!gates.ok) return { phase: p.id, verdict: 'escalated', summary: `gates red after review fix:\n${gates.report}`, branch: c.branch }
    pending = [...new Set(red.map(v => v.unit.split(':')[0].trim()))].filter(u => REVIEWERS.includes(u))
    if (!pending.length) pending = REVIEWERS // unit names unrecognised: re-run all rather than skip
  }
  return {
    phase: p.id, verdict: 'green', branch: c.branch, commit: c.commit, worktree: where,
    summary: `green after ${rounds} review fix round(s)`,
    constraints: derived.map(d => ({ phase: p.id, accepted: `phase ${p.id} accepted after correction`, derived: d.rule, evidence: d.evidence })),
  }
}

const state = {}, failed = [], held = [], constraints = [], layersRun = []
done.forEach(id => { state[id] = 'done' })
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

  const isolate = runnable.length > 1
  const results = await parallel(runnable.map(p => () => runPhase(p, isolate)))
  const green = []
  runnable.forEach((p, i) => {
    const r = results[i]
    if (r && r.verdict === 'green') { green.push({ p, r }); constraints.push(...(r.constraints || [])) }
    else { state[p.id] = 'failed'; failed.push({ phase: p.id, reason: r ? `${r.verdict}: ${r.summary}` : 'phase runner crashed' }) }
  })
  if (!isolate) { green.forEach(({ p }) => { state[p.id] = 'done' }); continue }
  if (!green.length) continue

  const m = await agent(
    `In the main checkout ${workdir}, merge these phase branches one at a time, in this order, with "git -C ${workdir} merge --no-ff <branch>":
${green.map(({ p, r }) => `- phase ${p.id}: branch ${r.branch}`).join('\n')}
Report "merged" and each conflict's "phase" as the bare phase id (e.g. "02").
If a merge conflicts, run "git merge --abort", record the conflict, and continue. Do not resolve conflicts yourself.
After all merges, run the test suite once in ${workdir} (${standards || 'use the plan test command'}) and report the result. Do not edit any file.
${SAFETY}`,
    { schema: MERGE, phase: 'Merge', label: `merge layer ${layer}`, effort: 'low' })
  const merged = new Set(m ? m.merged : [])
  for (const { p, r } of green) {
    if (merged.has(p.id) && m.testsGreen) state[p.id] = 'done'
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
  heldForApproval: held.map(id => ({ phase: id, file: abs(byId[id].file) })),
  blocked,
  constraints,
}
