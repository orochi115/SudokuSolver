// metrics.mjs <logDir> <milestone> [status] [attempts]
//
// Computes a milestone's metrics by summing the step_finish events across its
// per-attempt JSON logs (<milestone>-attempt-*.log). This replaces the old
// `opencode export` approach, which truncated large sessions at 128KB.
//
// Emits cost (USD), token breakdown, step count, and activeSec (model working
// time = last event ts - first event ts), plus status/attempts.
import { readFileSync, readdirSync } from 'node:fs';

const [logDir, ms, status = null, attempts = null] = process.argv.slice(2);

let cost = 0, input = 0, output = 0, reasoning = 0, cacheRead = 0, cacheWrite = 0, steps = 0;
let minTs = Infinity, maxTs = -Infinity;

try {
  const files = readdirSync(logDir).filter((f) => f.startsWith(`${ms}-attempt-`) && f.endsWith('.log'));
  for (const f of files) {
    const text = readFileSync(`${logDir}/${f}`, 'utf8');
    for (const line of text.split('\n')) {
      if (!line.trim()) continue;
      let o;
      try { o = JSON.parse(line); } catch { continue; }
      if (typeof o.timestamp === 'number') { if (o.timestamp < minTs) minTs = o.timestamp; if (o.timestamp > maxTs) maxTs = o.timestamp; }
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
  }
} catch { /* logDir missing -> empty metrics */ }

const activeSec = maxTs >= minTs ? Math.round((maxTs - minTs) / 1000) : null;

console.log(JSON.stringify({
  milestone: ms,
  status: status,
  attempts: attempts == null ? null : Number(attempts),
  activeSec,
  cost: Number(cost.toFixed(4)),
  steps,
  tokens: { input, output, reasoning, cacheRead, cacheWrite },
}));
