// metrics-grok.mjs <logDir> <phase> [status] [attempts] [wallSec]
//
// Metrics for grok-CLI runs. grok's JSON output shape differs from opencode and
// may not expose per-step cost/tokens, so this is best-effort: it scans the
// phase's attempt logs for any usage-ish fields (usage/tokens/cost, possibly
// nested) across both single-object and streaming-json outputs. activeSec falls
// back to the wall-clock seconds recorded by run-model.sh (passed as $5) when no
// timestamps are present. Missing cost is reported as null (flag in the report).
import { readFileSync, readdirSync } from 'node:fs';

const [logDir, ph, status = null, attempts = null, wallSec = null] = process.argv.slice(2);

let cost = 0, input = 0, output = 0, reasoning = 0, costSeen = false, tokSeen = false;
let minTs = Infinity, maxTs = -Infinity;

const num = (v) => (typeof v === 'number' && isFinite(v) ? v : 0);

// Pull usage-ish numbers out of an arbitrary object (handles a few common shapes).
function harvest(o) {
  if (!o || typeof o !== 'object') return;
  if (typeof o.timestamp === 'number') { if (o.timestamp < minTs) minTs = o.timestamp; if (o.timestamp > maxTs) maxTs = o.timestamp; }
  const u = o.usage || o.tokens || (o.part && o.part.tokens) || null;
  if (u && typeof u === 'object') {
    tokSeen = true;
    input += num(u.input ?? u.inputTokens ?? u.prompt_tokens ?? u.promptTokens);
    output += num(u.output ?? u.outputTokens ?? u.completion_tokens ?? u.completionTokens);
    reasoning += num(u.reasoning ?? u.reasoningTokens ?? u.reasoning_tokens);
  }
  const c = o.cost ?? (o.part && o.part.cost) ?? (o.usage && o.usage.cost);
  if (typeof c === 'number') { costSeen = true; cost += c; }
}

try {
  const files = readdirSync(logDir).filter((f) => f.startsWith(`${ph}-attempt-`) && f.endsWith('.log'));
  for (const f of files) {
    const text = readFileSync(`${logDir}/${f}`, 'utf8');
    // Try whole-file JSON first (single-object output), else line-by-line (streaming-json).
    let parsedWhole = false;
    try { harvest(JSON.parse(text)); parsedWhole = true; } catch { /* not a single object */ }
    if (!parsedWhole) {
      for (const line of text.split('\n')) {
        if (!line.trim()) continue;
        try { harvest(JSON.parse(line)); } catch { /* skip non-JSON line */ }
      }
    }
  }
} catch { /* logDir missing -> empty metrics */ }

const activeSec = maxTs >= minTs ? Math.round((maxTs - minTs) / 1000) : (wallSec != null ? Number(wallSec) : null);

console.log(JSON.stringify({
  milestone: ph,
  runner: 'grok',
  status,
  attempts: attempts == null ? null : Number(attempts),
  activeSec,
  cost: costSeen ? Number(cost.toFixed(4)) : null,
  tokens: tokSeen ? { input, output, reasoning } : null,
  note: costSeen ? undefined : 'grok did not expose cost in JSON output — cost N/A',
}));
