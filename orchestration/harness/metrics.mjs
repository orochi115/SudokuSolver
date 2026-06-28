// metrics.mjs <logDir> <milestone> [status] [attempts]
//
// Computes a milestone's metrics by summing the step_finish events across its
// per-attempt JSON logs (<milestone>-attempt-*.log). This replaces the old
// `opencode export` approach, which truncated large sessions at 128KB.
//
// CUMULATIVE across resumes: a re-run phase's prior attempt logs are moved by
// run-model.sh into <logDir>/prevruns/<milestone>-r<N>/. We include those here so
// cost/tokens reflect the TRUE total spend to reach the phase's result (the worktree
// is continued on top of the prior run's code, so its cost is part of the process).
//
// activeSec = SUM of each attempt's own (last-first) span — NOT a global max-min across
// all files. The old global span counted the idle gap BETWEEN runs/attempts (a resumed
// p3 once reported activeSec≈14450s ≈ 4h of mostly-idle wall time); per-attempt spans
// measure actual model working time.
import { readFileSync, readdirSync, existsSync } from 'node:fs';

const [logDir, ms, status = null, attempts = null] = process.argv.slice(2);

// Gather this phase's attempt logs from logDir AND any archived prior runs in prevruns/.
function attemptLogs(dir, msName) {
  const out = [];
  try {
    for (const f of readdirSync(dir)) {
      if (f.startsWith(`${msName}-attempt-`) && f.endsWith('.log')) out.push(`${dir}/${f}`);
    }
  } catch { /* dir missing */ }
  const pv = `${dir}/prevruns`;
  if (existsSync(pv)) {
    let subs = [];
    try { subs = readdirSync(pv); } catch { subs = []; }
    for (const s of subs) {
      if (!s.startsWith(`${msName}-r`)) continue;
      try {
        for (const f of readdirSync(`${pv}/${s}`)) {
          if (f.startsWith(`${msName}-attempt-`) && f.endsWith('.log')) out.push(`${pv}/${s}/${f}`);
        }
      } catch { /* skip */ }
    }
  }
  return out;
}

let cost = 0, input = 0, output = 0, reasoning = 0, cacheRead = 0, cacheWrite = 0, steps = 0;
let activeSec = 0;

for (const path of attemptLogs(logDir, ms)) {
  let text = '';
  try { text = readFileSync(path, 'utf8'); } catch { continue; }
  let fMin = Infinity, fMax = -Infinity;
  for (const line of text.split('\n')) {
    if (!line.trim()) continue;
    let o;
    try { o = JSON.parse(line); } catch { continue; }
    if (typeof o.timestamp === 'number') { if (o.timestamp < fMin) fMin = o.timestamp; if (o.timestamp > fMax) fMax = o.timestamp; }
    if (o.type !== 'step_finish') continue;
    const p = o.part || {};
    cost += p.cost || 0;
    const t = p.tokens || {};
    input += t.input || 0;
    output += t.output || 0;
    reasoning += t.reasoning || 0;
    cacheRead += (t.cache && t.cache.read) || 0;
    cacheWrite += (t.cache && t.cache.write) || 0;
    steps++;
  }
  if (fMax >= fMin) activeSec += Math.round((fMax - fMin) / 1000);
}

console.log(JSON.stringify({
  milestone: ms,
  status: status,
  attempts: attempts == null ? null : Number(attempts),
  activeSec: activeSec || null,
  cost: Number(cost.toFixed(4)),
  steps,
  tokens: { input, output, reasoning, cacheRead, cacheWrite },
}));
