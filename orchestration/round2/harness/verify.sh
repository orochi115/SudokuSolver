#!/usr/bin/env bash
# verify.sh <worktree-dir> <phase>     phase ∈ p0 p1 p2 e p3
#
# round2 SOFT-GATE verifier. Exit code:
#   0 = full pass (sound + clean + all required strategyIds registered)
#   2 = soft pass (sound + clean, but some required ids missing — scored by 727-delta)
#   1 = HARD fail (build/test fail, soundness violation on 400 OR 727, pollution, P3 leak)
#
# Hard gates (non-negotiable):
#   typecheck, unit tests, 0 soundness violations on the 400 ground-truth AND on the
#   727 target (per-step, vs brute oracle), no human-default POLLUTION (no strategy
#   uses the brute oracle; human-default 727 solved not implausibly high), and for
#   P3 the last-resort isolation (P3 ids never in human-default).
# Soft (recorded, not blocking): required-ids completeness, 727 solved counts.
set -uo pipefail

WT="${1:?usage: verify.sh <worktree-dir> <phase>}"
PH="${2:?missing phase}"
HARNESS="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
R2="$(cd "$HARNESS/.." && pwd)"
REQ_DIR="$R2/required-ids"
JUDGE400="$(cd "$HARNESS/../../harness/judge" && pwd)/verify-engine.ts"   # round1: 400 ground-truth soundness
JUDGE727="$HARNESS/judge/verify-727.ts"
P3_JUDGE="$HARNESS/judge/check-p3-isolation.ts"
POLLUTION_HUMAN_MAX="${POLLUTION_HUMAN_MAX:-480}"   # >this human-default solved on 727 ⇒ implausible w/o forcing ⇒ pollution

start=$(date +%s)
hard=0; reasons=""
note() { echo "[verify $PH] $*"; }

# --- 1) typecheck + tests (hard) ---
note "typecheck"; ( cd "$WT" && npm run typecheck ) || { hard=1; reasons="$reasons typecheck;"; }
note "unit tests"; ( cd "$WT" && npm test ) || { hard=1; reasons="$reasons tests;"; }

# --- 2) 400 ground-truth soundness (hard) — round1 judge, REQUIRE_IDS unset so it gates ONLY on soundness ---
note "400 ground-truth soundness"
cp "$JUDGE400" "$WT/.verify-engine.ts"
( cd "$WT" && unset REQUIRE_IDS && npx tsx .verify-engine.ts >/dev/null 2>&1 ) || { hard=1; reasons="$reasons gt400-soundness;"; }
rm -f "$WT/.verify-engine.ts"

# --- 3) 727 per-step soundness + counts + registered ids (hard on violations) ---
note "727 soundness + counts (human-default)"
cp "$JUDGE727" "$WT/.verify-727.ts"
humanOut="$( cd "$WT" && R2_PROFILE=human-default npx tsx .verify-727.ts 2>/dev/null )"; hrc=$?
[ "$hrc" -eq 0 ] || { hard=1; reasons="$reasons 727-soundness-human;"; }
solveHuman="$(printf '%s' "$humanOut" | grep -oE '"solved":[ ]*[0-9]+' | head -1 | grep -oE '[0-9]+')"
lastOut=""; solveLast=""
if [ "$PH" = "p3" ]; then
  note "727 soundness + counts (last-resort)"
  lastOut="$( cd "$WT" && R2_PROFILE=last-resort npx tsx .verify-727.ts 2>/dev/null )"; lrc=$?
  [ "$lrc" -eq 0 ] || { hard=1; reasons="$reasons 727-soundness-last;"; }
  solveLast="$(printf '%s' "$lastOut" | grep -oE '"solved":[ ]*[0-9]+' | head -1 | grep -oE '[0-9]+')"
fi
rm -f "$WT/.verify-727.ts"

# --- 4) P3 isolation (hard, p3 only) ---
if [ "$PH" = "p3" ]; then
  note "P3 anti-pollution isolation"
  P3_IDS="$(grep -vE '^[[:space:]]*(#|$)' "$REQ_DIR/p3-only.txt" | tr '\n' ' ')"; export P3_IDS
  cp "$P3_JUDGE" "$WT/.check-p3-isolation.ts"
  ( cd "$WT" && npx tsx .check-p3-isolation.ts >/dev/null 2>&1 ) || { hard=1; reasons="$reasons p3-leak;"; }
  rm -f "$WT/.check-p3-isolation.ts"
fi

# --- 5) pollution detection (hard) ---
# (a) no strategy may call the brute oracle (countSolutions/solveBruteforce/findGroundTruth) — that's cheating, not a technique.
note "pollution: brute-oracle use in strategies"
if grep -rnE "solveBruteforce|countSolutions|findGroundTruth" "$WT/packages/engine/src/strategies" "$WT/packages/engine/src/chain" 2>/dev/null | grep -vq '^$'; then
  hard=1; reasons="$reasons brute-oracle-in-strategy;"
  grep -rnE "solveBruteforce|countSolutions|findGroundTruth" "$WT/packages/engine/src/strategies" "$WT/packages/engine/src/chain" 2>/dev/null | head -5
fi
# (b) implausible human-default coverage (HoDoKu solves ~424/727 WITHOUT forcing; >MAX ⇒ forcing disguised as human)
if [ -n "${solveHuman:-}" ] && [ "$solveHuman" -gt "$POLLUTION_HUMAN_MAX" ]; then
  hard=1; reasons="$reasons human-default-implausible($solveHuman>$POLLUTION_HUMAN_MAX);"
  note "POLLUTION: human-default solved $solveHuman/727 > $POLLUTION_HUMAN_MAX — likely forcing disguised as human"
fi
# (c) WARN-only static smell (recorded, not blocking) — for the subjective review
pollWarn="$(grep -rlnE "backtrack|Math\.random|\\bguess\\b|trialAndError" "$WT/packages/engine/src/strategies" 2>/dev/null | tr '\n' ' ' || true)"

# --- 6) required-ids completeness (SOFT) ---
REQ_FILE="$REQ_DIR/$PH.txt"
missing=""
if [ -f "$REQ_FILE" ] && [ -n "${humanOut:-}" ]; then
  missing="$(REQ="$REQ_FILE" node -e '
    const fs=require("fs");
    let reg=new Set();
    try{ reg=new Set((JSON.parse(process.argv[1]).strategyIds)||[]); }catch(e){}
    const req=fs.readFileSync(process.env.REQ,"utf8").split(/\r?\n/).map(s=>s.trim()).filter(s=>s&&!s.startsWith("#"));
    process.stdout.write(req.filter(id=>!reg.has(id)).join(" "));
  ' "$humanOut" 2>/dev/null)"
fi

# --- decide rc + write consolidated json ---
end=$(date +%s); verifySec=$((end - start))
rc=0; status="full"
if [ "$hard" -ne 0 ]; then rc=1; status="hard"; elif [ -n "${missing// /}" ]; then rc=2; status="soft"; fi

esc() { printf '%s' "$1" | sed 's/"/\\"/g'; }
cat > "$WT/.r2-verify-$PH.json" <<EOF
{"phase":"$PH","status":"$status","rc":$rc,"verifySec":$verifySec,
 "solveHuman":"${solveHuman:-}/727","solveLastResort":"${solveLast:+$solveLast/727}",
 "missingIds":"$(esc "${missing# }")","pollutionWarnFiles":"$(esc "$pollWarn")","hardReasons":"$(esc "${reasons# }")"}
EOF

if [ "$rc" -eq 1 ]; then note "HARD FAIL: ${reasons:-?}";
elif [ "$rc" -eq 2 ]; then note "SOFT PASS (sound+clean; missing ids: ${missing# }); 727 human=${solveHuman:-?} last=${solveLast:-n/a}, verify ${verifySec}s";
else note "FULL PASS; 727 human=${solveHuman:-?} last=${solveLast:-n/a}, verify ${verifySec}s"; fi
exit "$rc"
