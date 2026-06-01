# 横评结果汇总

> 由 report.sh 生成。判据:M2/M3 是否通过验收闸门(typecheck + test + 健全性 0 violation)。
> solveRate / violations 来自裁判脚本对冻结 `data/ground-truth` 的实跑。

## sonnet46  (`anthropic/claude-sonnet-4-6`)

- M2: **PASS**   M3: **PASS**
- 引擎裁判(当前 worktree 状态):
```json
{
  "strategies": 28,
  "totalPuzzles": 400,
  "totalViolations": 0,
  "report": {
    "easy": {
      "n": 100,
      "solved": 100,
      "solveRate": 1,
      "violations": 0
    },
    "medium": {
      "n": 100,
      "solved": 100,
      "solveRate": 1,
      "violations": 0
    },
    "hard": {
      "n": 100,
      "solved": 100,
      "solveRate": 1,
      "violations": 0
    },
    "diabolical": {
      "n": 100,
      "solved": 77,
      "solveRate": 0.77,
      "violations": 0
    }
  }
}
```
- 产出文档:
  - `docs/notes/m2.md` ✅
  - `docs/notes/m3.md` —
  - `docs/forcing-boundary.md` —
  - `docs/flow.md` —
- 成本(token cost,来自 opencode export):
  - m2: `{"sessionID":"ses_17c19aae5ffeR0QktdIktGZmbF","note":"export failed","error":"Unterminated string in JSON at position 61158 (line 146 column 12391)"}`
  - m3: `{"sessionID":"ses_17c05f6c7ffeHAYUG0v9BjPbox","note":"export failed","error":"Unterminated string in JSON at position 64930 (line 104 column 6034)"}`
- ⚠️ 异常记录(notes):
    23:56:10 attempted-floor: require strategies > 1 (else retry)
    00:17:41 attempted-floor: require strategies > 20 (else retry)
    00:47:41 opencode TIMEOUT after 1800s (attempt killed) -> m3-attempt-1.log
- 日志:`sudoku-wt/logs/sonnet46/`(pipeline.log + 各 attempt 的 opencode JSON)

## gemini35flash  (`google/gemini-3.5-flash`)

- M2: **PASS**   M3: **PASS**
- 引擎裁判(当前 worktree 状态):
```json
{
  "strategies": 25,
  "totalPuzzles": 400,
  "totalViolations": 0,
  "report": {
    "easy": {
      "n": 100,
      "solved": 100,
      "solveRate": 1,
      "violations": 0
    },
    "medium": {
      "n": 100,
      "solved": 100,
      "solveRate": 1,
      "violations": 0
    },
    "hard": {
      "n": 100,
      "solved": 100,
      "solveRate": 1,
      "violations": 0
    },
    "diabolical": {
      "n": 100,
      "solved": 82,
      "solveRate": 0.82,
      "violations": 0
    }
  }
}
```
- 产出文档:
  - `docs/notes/m2.md` ✅
  - `docs/notes/m3.md` ✅
  - `docs/forcing-boundary.md` ✅
  - `docs/flow.md` ✅
- 成本(token cost,来自 opencode export):
  - m2: `{"sessionID":"ses_17c19ac24ffeJX22AVEOG0J3Df","note":"export failed","error":"Unterminated string in JSON at position 60144 (line 146 column 16415)"}`
  - m3: `{"sessionID":"ses_17c11d32dffeFDhPlE0QfgbVev","note":"export failed","error":"Unexpected end of JSON input"}`
- ⚠️ 异常记录(notes):
    23:56:09 attempted-floor: require strategies > 1 (else retry)
    00:04:44 attempted-floor: require strategies > 20 (else retry)
- 日志:`sudoku-wt/logs/gemini35flash/`(pipeline.log + 各 attempt 的 opencode JSON)

