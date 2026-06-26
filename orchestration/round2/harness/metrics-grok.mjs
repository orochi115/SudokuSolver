// metrics-grok.mjs <logDir> <phase> [status] [attempts] [wallSec]
//
// grok CLI exposes NO per-session token/cost (verified: absent from json/streaming
// output, ~/.grok/sessions, unified.jsonl, and `grok trace` export — billing is
// server-side on the xAI/Cursor account). So this reports a best-effort ESTIMATE:
//   - output tokens ≈ chars of streamed thought/text/tool `data` ÷ 4
//   - input tokens  ≈ chars of the prompt files we sent ÷ 4 (UNDERcount: excludes
//     the context/tool-results grok assembles server-side)
//   - cost: only if GROK_PRICE_IN / GROK_PRICE_OUT (USD per 1M tokens) are set;
//     else null with a note to read the provider dashboard for exact spend.
// For exact cost, cross-check the xAI console (grok-build) / Cursor dashboard
// (grok-composer) for the run window.
import { readFileSync, readdirSync } from 'node:fs';

const [logDir, ph, status = null, attempts = null, wallSec = null] = process.argv.slice(2);
const CHARS_PER_TOK = 4;
const priceIn = process.env.GROK_PRICE_IN ? Number(process.env.GROK_PRICE_IN) : null;   // $/1M input tok
const priceOut = process.env.GROK_PRICE_OUT ? Number(process.env.GROK_PRICE_OUT) : null; // $/1M output tok

let outChars = 0, inChars = 0, events = 0;
let minTs = Infinity, maxTs = -Infinity;

const ls = (() => { try { return readdirSync(logDir); } catch { return []; } })();

// output: streamed events (streaming-json: {type:thought|text|tool...,data:"..."}); sum data chars.
for (const f of ls.filter((x) => x.startsWith(`${ph}-attempt-`) && x.endsWith('.log'))) {
  let text = '';
  try { text = readFileSync(`${logDir}/${f}`, 'utf8'); } catch { continue; }
  for (const line of text.split('\n')) {
    if (!line.trim()) continue;
    let o; try { o = JSON.parse(line); } catch { outChars += line.length; continue; } // non-JSON line: count raw
    events++;
    if (typeof o.ts === 'number') { if (o.ts < minTs) minTs = o.ts; if (o.ts > maxTs) maxTs = o.ts; }
    if (typeof o.data === 'string') outChars += o.data.length;
    else if (typeof o.text === 'string') outChars += o.text.length;
  }
}
// input: the prompt files we fed (<phase>-prompt-*.txt)
for (const f of ls.filter((x) => x.startsWith(`${ph}-prompt-`) && x.endsWith('.txt'))) {
  try { inChars += readFileSync(`${logDir}/${f}`, 'utf8').length; } catch { /* skip */ }
}

const estIn = Math.round(inChars / CHARS_PER_TOK);
const estOut = Math.round(outChars / CHARS_PER_TOK);
const activeSec = maxTs >= minTs ? Math.round((maxTs - minTs) / 1000) : (wallSec != null ? Number(wallSec) : null);

let cost = null;
let note = 'grok exposes no token/cost — tokens are ESTIMATES (chars/4); set GROK_PRICE_IN/OUT for an est cost, else read xAI/Cursor dashboard for exact spend';
if (priceIn != null && priceOut != null) {
  cost = Number(((estIn / 1e6) * priceIn + (estOut / 1e6) * priceOut).toFixed(4));
  note = `grok cost ESTIMATED = chars/4 × prices (in $${priceIn}/out $${priceOut} per 1M); cross-check dashboard`;
}

console.log(JSON.stringify({
  milestone: ph, runner: 'grok', status,
  attempts: attempts == null ? null : Number(attempts),
  activeSec, cost, costEstimated: cost != null,
  tokensEst: { input: estIn, output: estOut }, events, note,
}));
