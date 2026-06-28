#!/usr/bin/env python3
"""One-off repair for the round2 run1+resume(run2) overlap.

For each model/phase:
  - partition <phase>-attempt-*.log by mtime vs RUN2_START
  - move run1 (orphan) attempt/prompt/verify files into prevruns/<phase>-r1/ (preserve)
  - recompute run2-clean metrics from the run2-only logs (per-attempt-span activeSec)
  - write cumulative <phase>.metrics.json:
        re-run phase (logs in both runs): run1(from 08:21 snapshot) + run2-clean
        run2-only phase (SKIP in run1):   run2-clean
        run1-only phase (OK then skipped): left untouched
  - back up the pre-repair metrics.json to <phase>.metrics.pre-repair.json
Also dedup status/<name>.tsv to one authoritative (last-wins) row per phase.
"""
import json, os, re, glob, shutil, sys

REPO = "/Users/sakura/LLM_Work/SudokuSolver"
LOGS = "/Users/sakura/LLM_Work/sudoku-wt-r2/logs"
R2 = f"{REPO}/orchestration/round2"
SNAP = f"{R2}/reports/_run1-snapshot-20260628-142939/summary.md"
STATUS = f"{R2}/reports/status"
MODELS_FILE = f"{R2}/models.txt"
PHASES = ["p0", "p1", "p2a", "p2b", "e", "p3"]
RUN2_START = 1782607436  # 2026-06-28 08:43:56

def models():
    out = []
    for ln in open(MODELS_FILE):
        ln = ln.strip()
        if not ln or ln.startswith("#"):
            continue
        parts = ln.split()
        out.append((parts[0], parts[1], parts[2] if len(parts) > 2 else "opencode"))
    return out  # (model, name, runner)

def parse_snapshot():
    """(name,phase) -> dict(cost, activeSec, tin, tout). Rows are split across 2 lines."""
    txt = open(SNAP).read().splitlines()
    rows, i = {}, 0
    while i < len(txt):
        line = txt[i]
        if line.startswith("|"):
            row = line
            while i + 1 < len(txt) and txt[i+1] and not txt[i+1].startswith("|"):
                row += txt[i+1]; i += 1
            cells = [c.strip() for c in row.split("|")]
            while cells and cells[-1] == "":
                cells.pop()  # drop trailing empty from final '|'
            # Left side: 0='', 1=name, 2=runner, 3=phase, 4=status. The OLD report.sh bug
            # doubled the status cell ("STOP"+"STOP") for models touched by >1 run, shifting
            # left columns — so parse the numeric fields from the RIGHT, which is stable:
            #   [-1]=tokens(in/out)  [-2]=cost  [-3]=activeSec  [-4]=verifySec
            if len(cells) >= 8 and cells[3] in PHASES:
                name, ph = cells[1], cells[3]
                def num(x):
                    x = (x or "").strip()
                    return None if x in ("—", "", "null", "N/A") else x
                raw_status = cells[4]
                status = next((s for s in ("STOP", "SKIP", "OK") if raw_status.startswith(s)), raw_status)
                tin = tout = None
                if "/" in cells[-1]:
                    a, b = cells[-1].split("/", 1)
                    tin, tout = num(a), num(b)
                rows[(name, ph)] = dict(status=status, cost=num(cells[-2]), activeSec=num(cells[-3]), tin=tin, tout=tout)
        i += 1
    return rows

def recompute_opencode(files):
    cost = tin = tout = reasoning = cread = cwrite = steps = 0
    active = 0
    for p in files:
        fmin, fmax = float("inf"), float("-inf")
        for ln in open(p, encoding="utf-8", errors="ignore"):
            ln = ln.strip()
            if not ln:
                continue
            try: o = json.loads(ln)
            except Exception: continue
            ts = o.get("timestamp")
            if isinstance(ts, (int, float)):
                fmin = min(fmin, ts); fmax = max(fmax, ts)
            if o.get("type") != "step_finish":
                continue
            part = o.get("part", {}) or {}
            cost += part.get("cost", 0) or 0
            t = part.get("tokens", {}) or {}
            tin += t.get("input", 0) or 0
            tout += t.get("output", 0) or 0
            reasoning += t.get("reasoning", 0) or 0
            c = t.get("cache", {}) or {}
            cread += c.get("read", 0) or 0
            cwrite += c.get("write", 0) or 0
            steps += 1
        if fmax >= fmin:
            active += round((fmax - fmin) / 1000)
    return dict(cost=round(cost, 4), activeSec=active or None, steps=steps,
                tokens=dict(input=tin, output=tout, reasoning=reasoning, cacheRead=cread, cacheWrite=cwrite))

def recompute_grok(attempt_files, prompt_files):
    outc = inc = events = 0
    active = 0
    for p in attempt_files:
        fmin, fmax = float("inf"), float("-inf")
        for ln in open(p, encoding="utf-8", errors="ignore"):
            ln = ln.strip()
            if not ln:
                continue
            try: o = json.loads(ln)
            except Exception:
                outc += len(ln); continue
            events += 1
            ts = o.get("ts")
            if isinstance(ts, (int, float)):
                fmin = min(fmin, ts); fmax = max(fmax, ts)
            if isinstance(o.get("data"), str): outc += len(o["data"])
            elif isinstance(o.get("text"), str): outc += len(o["text"])
        if fmax >= fmin:
            active += round((fmax - fmin) / 1000)
    for p in prompt_files:
        try: inc += len(open(p, encoding="utf-8", errors="ignore").read())
        except Exception: pass
    return dict(tokensEst=dict(input=round(inc/4), output=round(outc/4)),
                events=events, activeSec=active or None, cost=None, costEstimated=False)

def add_num(a, b):
    if a is None and b is None: return None
    return (float(a) if a not in (None, "") else 0) + (float(b) if b not in (None, "") else 0)

def main():
    snap = parse_snapshot()
    changed, moved = [], 0
    for model, name, runner in models():
        ldir = f"{LOGS}/{name}"
        if not os.path.isdir(ldir):
            continue
        for ph in PHASES:
            attempts = sorted(glob.glob(f"{ldir}/{ph}-attempt-*.log"))
            run1_orphans = [f for f in attempts if os.path.getmtime(f) < RUN2_START]
            run2 = [f for f in attempts if os.path.getmtime(f) >= RUN2_START]
            if not run2:
                continue  # not processed in run2 (OK-skipped or never reached) -> metrics.json stays
            # "ran in run1" is decided by the snapshot STATUS (OK/STOP = executed), NOT by
            # whether orphan logs survived: run2 overwrote run1's logs whenever it used >=
            # as many attempts, so orphan survival under-detects run1 participation.
            s = snap.get((name, ph), {})
            run1_ran = s.get("status") in ("OK", "STOP")
            run1m = s if run1_ran else {}
            mj = f"{ldir}/{ph}.metrics.json"
            if os.path.exists(mj) and not os.path.exists(f"{ldir}/{ph}.metrics.pre-repair.json"):
                shutil.copy2(mj, f"{ldir}/{ph}.metrics.pre-repair.json")  # preserve ORIGINAL only
            # move surviving run1 orphans into prevruns/<phase>-r1/ (tidiness; idempotent)
            if run1_orphans:
                dst = f"{ldir}/prevruns/{ph}-r1"
                os.makedirs(dst, exist_ok=True)
                for f in run1_orphans:
                    shutil.move(f, f"{dst}/{os.path.basename(f)}"); moved += 1
                for f in glob.glob(f"{ldir}/{ph}-prompt-*.txt") + glob.glob(f"{ldir}/{ph}-verify-*.out") + glob.glob(f"{ldir}/{ph}-verify-*.out.rc"):
                    if os.path.getmtime(f) < RUN2_START:
                        shutil.move(f, f"{dst}/{os.path.basename(f)}"); moved += 1
            run1 = run1_ran  # gate cumulative add on snapshot status, not orphan presence
            # recompute run2-clean from remaining (run2) logs
            if runner == "grok":
                run2_prompts = [f for f in glob.glob(f"{ldir}/{ph}-prompt-*.txt") if os.path.getmtime(f) >= RUN2_START]
                m2 = recompute_grok(run2, run2_prompts)
                s = snap.get((name, ph), {})
                cum = dict(milestone=ph, runner="grok", status=None, attempts=None,
                           activeSec=(add_num(m2["activeSec"], s.get("activeSec")) if run1 else m2["activeSec"]),
                           cost=None, costEstimated=False,
                           tokensEst=dict(
                               input=int(add_num(m2["tokensEst"]["input"], s.get("tin")) or 0) if run1 else m2["tokensEst"]["input"],
                               output=int(add_num(m2["tokensEst"]["output"], s.get("tout")) or 0) if run1 else m2["tokensEst"]["output"]),
                           events=m2["events"],
                           note="REPAIRED cumulative: run1(snapshot)+run2 (grok tokens are chars/4 estimates; cost N/A)")
            else:
                m2 = recompute_opencode(run2)
                s = snap.get((name, ph), {})
                if run1:
                    cum = dict(milestone=ph, status=None, attempts=None,
                               activeSec=add_num(m2["activeSec"], s.get("activeSec")),
                               cost=round(add_num(m2["cost"], s.get("cost")) or 0, 4),
                               steps=m2["steps"],
                               tokens=dict(
                                   input=int(add_num(m2["tokens"]["input"], s.get("tin")) or 0),
                                   output=int(add_num(m2["tokens"]["output"], s.get("tout")) or 0),
                                   reasoning=m2["tokens"]["reasoning"], cacheRead=m2["tokens"]["cacheRead"], cacheWrite=m2["tokens"]["cacheWrite"]),
                               note="REPAIRED cumulative: run1(snapshot)+run2-clean")
                else:
                    cum = dict(milestone=ph, status=None, attempts=None, **m2,
                               note="REPAIRED: run2-only (SKIP in run1)")
            json.dump(cum, open(mj, "w"))
            tag = "rerun(run1+run2)" if run1 else "run2-only"
            changed.append(f"  {name:14s} {ph:4s} [{tag}] cost={cum.get('cost')} active={cum.get('activeSec')}s")

    # dedup status .tsv: last-wins per phase, in PHASES order
    deduped = 0
    for f in glob.glob(f"{STATUS}/*.tsv"):
        if f.endswith(".hist.tsv"):
            continue
        last = {}
        for ln in open(f):
            c = ln.rstrip("\n").split("\t")
            if len(c) >= 2 and c[0] in PHASES:
                last[c[0]] = c[1]
        n_before = sum(1 for ln in open(f) if ln.strip())
        with open(f, "w") as w:
            for ph in PHASES:
                if ph in last:
                    w.write(f"{ph}\t{last[ph]}\n")
        if n_before > len(last):
            deduped += 1

    print("=== metrics repaired (%d phases) ===" % len(changed))
    print("\n".join(changed))
    print(f"\n=== moved {moved} orphan files into prevruns/, deduped {deduped} status files ===")

if __name__ == "__main__":
    main()
