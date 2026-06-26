/**
 * P3 anti-pollution gate (round2, P3 phase only).
 *
 * verify.sh copies this into the target worktree and runs it with `npx tsx`.
 * For every P3 strategyId (P3_IDS env) that the worker has REGISTERED, it must
 * be isolated to the last-resort profile: present in LAST_RESORT_IDS and ABSENT
 * from HUMAN_DEFAULT_STRATEGIES. A P3 id leaking into human-default fails the gate.
 * (Missing/unregistered P3 ids are caught separately by the required-ids gate.)
 */
import { STRATEGIES, HUMAN_DEFAULT_STRATEGIES, LAST_RESORT_IDS } from './packages/engine/src/index.js';

const p3Ids = (process.env.P3_IDS ?? '')
  .split(/[\s,]+/)
  .map((s) => s.trim())
  .filter(Boolean);

const registered = new Set(STRATEGIES.map((s) => s.id));
const humanDefault = new Set(HUMAN_DEFAULT_STRATEGIES.map((s) => s.id));

const leaked: string[] = [];      // registered P3 id that reached human-default
const notLastResort: string[] = []; // registered P3 id missing from LAST_RESORT_IDS

for (const id of p3Ids) {
  if (!registered.has(id)) continue; // required-ids gate handles "not implemented"
  if (humanDefault.has(id)) leaked.push(id);
  if (!LAST_RESORT_IDS.has(id)) notLastResort.push(id);
}

const reasons: string[] = [];
if (leaked.length) reasons.push(`P3 id(s) polluting human-default: ${leaked.join(', ')}`);
if (notLastResort.length) reasons.push(`P3 id(s) not in LAST_RESORT_IDS: ${notLastResort.join(', ')}`);

console.log(JSON.stringify({
  p3Checked: p3Ids.filter((id) => registered.has(id)),
  leaked,
  notLastResort,
}, null, 2));

if (reasons.length) {
  console.error('P3 ISOLATION FAIL: ' + reasons.join('; '));
  process.exit(1);
}
console.error('P3 ISOLATION OK (all registered P3 ids are last-resort-only).');
