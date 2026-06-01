// cost-of-session.mjs <sessionID>
// Sums token cost/usage across a session's assistant messages via `opencode export`.
// Prints a compact JSON line. Best-effort: prints an error object on failure.
import { execFileSync } from 'node:child_process';

const sid = process.argv[2];
if (!sid) {
  console.log(JSON.stringify({ sessionID: null, note: 'no session id' }));
  process.exit(0);
}

try {
  const raw = execFileSync('opencode', ['export', sid], { encoding: 'utf8', maxBuffer: 1 << 30 });
  const o = JSON.parse(raw);
  const messages = Array.isArray(o.messages) ? o.messages : [];
  let cost = 0, input = 0, output = 0, reasoning = 0, cacheRead = 0, cacheWrite = 0, asst = 0;
  for (const m of messages) {
    const info = m.info ?? m;
    if (info.role !== 'assistant') continue;
    asst++;
    cost += info.cost ?? 0;
    const t = info.tokens ?? {};
    input += t.input ?? 0;
    output += t.output ?? 0;
    reasoning += t.reasoning ?? 0;
    cacheRead += t.cache?.read ?? 0;
    cacheWrite += t.cache?.write ?? 0;
  }
  console.log(JSON.stringify({
    sessionID: sid,
    cost: Number(cost.toFixed(4)),
    assistantMessages: asst,
    tokens: { input, output, reasoning, cacheRead, cacheWrite },
  }));
} catch (e) {
  console.log(JSON.stringify({ sessionID: sid, note: 'export failed', error: String(e?.message ?? e) }));
}
