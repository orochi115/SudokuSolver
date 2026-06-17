# 横评结果汇总

> 由 report.sh 生成。判据:M2/M3 是否通过验收闸门(typecheck + test + 健全性 0 violation)。
> solveRate / violations 来自裁判脚本对冻结 `data/ground-truth` 的实跑。

## opus48  (`anthropic/claude-opus-4-8`)

- M2: **PASS**   M3: **PASS**
- 引擎裁判(当前 worktree 状态):
```json
{
  "strategies": 17,
  "strategyIds": [
    "full-house",
    "naked-single",
    "hidden-single",
    "locked-candidates",
    "naked-subset",
    "hidden-subset",
    "basic-fish",
    "single-digit-patterns",
    "w-wing",
    "xy-wing",
    "xyz-wing",
    "simple-coloring",
    "aic",
    "als",
    "uniqueness",
    "sue-de-coq",
    "forcing-chain"
  ],
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
      "solved": 88,
      "solveRate": 0.88,
      "violations": 0
    }
  }
}
```
- 产出文档:
  - `docs/notes/m2.md` ✅
  - `docs/notes/m3.md` —
  - `docs/forcing-boundary.md` ✅
  - `docs/flow.md` —
- 指标(cost / runtime / tokens,来自各 attempt 日志的 step_finish):
  - m2: `{"milestone":"m2","status":"PASS","attempts":1,"activeSec":680,"cost":5.6217,"steps":63,"tokens":{"input":126,"output":51591,"reasoning":0,"cacheRead":6845836,"cacheWrite":145342}}`
  - m3: `{"milestone":"m3","status":"PASS","attempts":1,"activeSec":1794,"cost":7.0105,"steps":60,"tokens":{"input":120,"output":70887,"reasoning":0,"cacheRead":8201598,"cacheWrite":181916}}`
- ⚠️ 异常记录(notes):
    02:17:45 opencode TIMEOUT after 1800s (attempt killed) -> m3-attempt-1.log
- 日志:`sudoku-wt/logs/opus48/`(pipeline.log + 各 attempt 的 opencode JSON)

## sonnet46  (`anthropic/claude-sonnet-4-6`)

- M2: **PASS**   M3: **PASS**
- 引擎裁判(当前 worktree 状态):
```json
{
  "strategies": 17,
  "strategyIds": [
    "full-house",
    "naked-single",
    "hidden-single",
    "locked-candidates",
    "naked-subset",
    "hidden-subset",
    "basic-fish",
    "single-digit-patterns",
    "xy-wing",
    "xyz-wing",
    "w-wing",
    "simple-coloring",
    "aic",
    "als",
    "uniqueness",
    "sue-de-coq",
    "forcing-chain"
  ],
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
      "solved": 99,
      "solveRate": 0.99,
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
- 指标(cost / runtime / tokens,来自各 attempt 日志的 step_finish):
  - m2: `{"milestone":"m2","status":"PASS","attempts":1,"activeSec":1011,"cost":3.9541,"steps":81,"tokens":{"input":83,"output":64954,"reasoning":0,"cacheRead":8074350,"cacheWrite":148605}}`
  - m3: `{"milestone":"m3","status":"PASS","attempts":2,"activeSec":2414,"cost":6.4798,"steps":92,"tokens":{"input":96,"output":92621,"reasoning":0,"cacheRead":12294382,"cacheWrite":373841}}`
- ⚠️ 异常记录(notes):
    02:23:16 opencode TIMEOUT after 1800s (attempt killed) -> m3-attempt-1.log
- 日志:`sudoku-wt/logs/sonnet46/`(pipeline.log + 各 attempt 的 opencode JSON)

## gpt55  (`openai/gpt-5.5`)

- M2: **PASS**   M3: **PASS**
- 引擎裁判(当前 worktree 状态):
```json
{
  "strategies": 17,
  "strategyIds": [
    "full-house",
    "naked-single",
    "hidden-single",
    "locked-candidates",
    "naked-subset",
    "hidden-subset",
    "basic-fish",
    "single-digit-patterns",
    "xy-wing",
    "xyz-wing",
    "w-wing",
    "simple-coloring",
    "aic",
    "als",
    "uniqueness",
    "sue-de-coq",
    "forcing-chain"
  ],
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
      "solved": 97,
      "solveRate": 0.97,
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
- 指标(cost / runtime / tokens,来自各 attempt 日志的 step_finish):
  - m2: `{"milestone":"m2","status":"PASS","attempts":1,"activeSec":920,"cost":13.7308,"steps":48,"tokens":{"input":2426760,"output":23095,"reasoning":6041,"cacheRead":1445888,"cacheWrite":0}}`
  - m3: `{"milestone":"m3","status":"PASS","attempts":1,"activeSec":671,"cost":2.6749,"steps":37,"tokens":{"input":107968,"output":19768,"reasoning":5603,"cacheRead":2747904,"cacheWrite":0}}`
- 日志:`sudoku-wt/logs/gpt55/`(pipeline.log + 各 attempt 的 opencode JSON)

## gpt53codex  (`openai/gpt-5.3-codex`)

- M2: **PASS**   M3: **PASS**
- 引擎裁判(当前 worktree 状态):
```json
{
  "strategies": 17,
  "strategyIds": [
    "full-house",
    "naked-single",
    "hidden-single",
    "locked-candidates",
    "naked-subset",
    "hidden-subset",
    "basic-fish",
    "single-digit-patterns",
    "xy-wing",
    "xyz-wing",
    "w-wing",
    "simple-coloring",
    "aic",
    "als",
    "uniqueness",
    "sue-de-coq",
    "forcing-chain"
  ],
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
      "solved": 78,
      "solveRate": 0.78,
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
- 指标(cost / runtime / tokens,来自各 attempt 日志的 step_finish):
  - m2: `{"milestone":"m2","status":"PASS","attempts":1,"activeSec":663,"cost":1.672,"steps":64,"tokens":{"input":192183,"output":25528,"reasoning":11330,"cacheRead":4683648,"cacheWrite":0}}`
  - m3: `{"milestone":"m3","status":"PASS","attempts":1,"activeSec":826,"cost":1.6932,"steps":72,"tokens":{"input":84996,"output":27912,"reasoning":14481,"cacheRead":5434112,"cacheWrite":0}}`
- 日志:`sudoku-wt/logs/gpt53codex/`(pipeline.log + 各 attempt 的 opencode JSON)

## gemini35flash  (`google/gemini-3.5-flash`)

- M2: **PASS**   M3: **PASS**
- 引擎裁判(当前 worktree 状态):
```json
{
  "strategies": 17,
  "strategyIds": [
    "full-house",
    "naked-single",
    "hidden-single",
    "locked-candidates",
    "naked-subset",
    "hidden-subset",
    "basic-fish",
    "xy-wing",
    "xyz-wing",
    "w-wing",
    "single-digit-patterns",
    "simple-coloring",
    "aic",
    "als",
    "uniqueness",
    "sue-de-coq",
    "forcing-chain"
  ],
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
      "solved": 81,
      "solveRate": 0.81,
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
- 指标(cost / runtime / tokens,来自各 attempt 日志的 step_finish):
  - m2: `{"milestone":"m2","status":"PASS","attempts":1,"activeSec":1465,"cost":3.1643,"steps":71,"tokens":{"input":635736,"output":42998,"reasoning":60286,"cacheRead":8540843,"cacheWrite":0}}`
  - m3: `{"milestone":"m3","status":"PASS","attempts":1,"activeSec":448,"cost":2.3883,"steps":76,"tokens":{"input":571488,"output":31793,"reasoning":26607,"cacheRead":6703413,"cacheWrite":0}}`
- 日志:`sudoku-wt/logs/gemini35flash/`(pipeline.log + 各 attempt 的 opencode JSON)

## grok43  (`xai/grok-4.3`)

- M2: **PASS**   M3: **PASS**
- 引擎裁判(当前 worktree 状态):
```json
{
  "strategies": 17,
  "strategyIds": [
    "full-house",
    "naked-single",
    "hidden-single",
    "locked-candidates",
    "naked-subset",
    "hidden-subset",
    "basic-fish",
    "single-digit-patterns",
    "xy-wing",
    "xyz-wing",
    "w-wing",
    "simple-coloring",
    "aic",
    "als",
    "uniqueness",
    "sue-de-coq",
    "forcing-chain"
  ],
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
      "solved": 67,
      "solveRate": 0.67,
      "violations": 0
    },
    "hard": {
      "n": 100,
      "solved": 0,
      "solveRate": 0,
      "violations": 0
    },
    "diabolical": {
      "n": 100,
      "solved": 0,
      "solveRate": 0,
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
- 指标(cost / runtime / tokens,来自各 attempt 日志的 step_finish):
  - m2: `{"milestone":"m2","status":"PASS","attempts":2,"activeSec":218,"cost":1.3266,"steps":56,"tokens":{"input":588370,"output":8857,"reasoning":3111,"cacheRead":2806144,"cacheWrite":0}}`
  - m3: `{"milestone":"m3","status":"PASS","attempts":1,"activeSec":75,"cost":0.3483,"steps":20,"tokens":{"input":145790,"output":2750,"reasoning":1822,"cacheRead":773312,"cacheWrite":0}}`
- 日志:`sudoku-wt/logs/grok43/`(pipeline.log + 各 attempt 的 opencode JSON)

## qwen3coder  (`alibaba-cn/qwen3-coder-flash`)

- M2: **FAIL**   M3: **SKIP**
- 引擎裁判(当前 worktree 状态):
```json
{
  "strategies": 11,
  "strategyIds": [
    "naked-single",
    "full-house",
    "hidden-single",
    "locked-candidates",
    "naked-subset",
    "hidden-subset",
    "basic-fish",
    "single-digit-patterns",
    "xy-wing",
    "xyz-wing",
    "w-wing"
  ],
  "totalPuzzles": 400,
  "totalViolations": 3817,
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
      "violations": 149
    },
    "hard": {
      "n": 100,
      "solved": 100,
      "solveRate": 1,
      "violations": 1595
    },
    "diabolical": {
      "n": 100,
      "solved": 100,
      "solveRate": 1,
      "violations": 2073
    }
  }
}
{}
```
- 产出文档:
  - `docs/notes/m2.md` ✅
  - `docs/notes/m3.md` —
  - `docs/forcing-boundary.md` —
  - `docs/flow.md` —
- 指标(cost / runtime / tokens,来自各 attempt 日志的 step_finish):
  - m2: `{"milestone":"m2","status":"FAIL","attempts":3,"activeSec":1912,"cost":0.3741,"steps":108,"tokens":{"input":2378559,"output":55012,"reasoning":0,"cacheRead":7601408,"cacheWrite":0}}`
- 日志:`sudoku-wt/logs/qwen3coder/`(pipeline.log + 各 attempt 的 opencode JSON)

## deepseekv4  (`alibaba-cn/deepseek-v4-flash`)

- M2: **PASS**   M3: **PASS**
- 引擎裁判(当前 worktree 状态):
```json
{
  "strategies": 17,
  "strategyIds": [
    "full-house",
    "naked-single",
    "hidden-single",
    "locked-candidates",
    "naked-subset",
    "hidden-subset",
    "basic-fish",
    "single-digit-patterns",
    "xy-wing",
    "xyz-wing",
    "w-wing",
    "simple-coloring",
    "aic",
    "als",
    "uniqueness",
    "sue-de-coq",
    "forcing-chain"
  ],
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
      "solved": 72,
      "solveRate": 0.72,
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
- 指标(cost / runtime / tokens,来自各 attempt 日志的 step_finish):
  - m2: `{"milestone":"m2","status":"PASS","attempts":1,"activeSec":885,"cost":0.2203,"steps":86,"tokens":{"input":1249371,"output":50763,"reasoning":26176,"cacheRead":8503552,"cacheWrite":0}}`
  - m3: `{"milestone":"m3","status":"PASS","attempts":1,"activeSec":875,"cost":0.1164,"steps":70,"tokens":{"input":521213,"output":51335,"reasoning":36139,"cacheRead":6781056,"cacheWrite":0}}`
- 日志:`sudoku-wt/logs/deepseekv4/`(pipeline.log + 各 attempt 的 opencode JSON)

## minimax-m27  (`alibaba-cn/MiniMax/MiniMax-M2.7`)

- M2: **FAIL**   M3: **SKIP**
- 引擎裁判(当前 worktree 状态):
```json
{
  "strategies": 1,
  "strategyIds": [
    "naked-single"
  ],
  "totalPuzzles": 400,
  "totalViolations": 0,
  "report": {
    "easy": {
      "n": 100,
      "solved": 54,
      "solveRate": 0.54,
      "violations": 0
    },
    "medium": {
      "n": 100,
      "solved": 14,
      "solveRate": 0.14,
      "violations": 0
    },
    "hard": {
      "n": 100,
      "solved": 0,
      "solveRate": 0,
      "violations": 0
    },
    "diabolical": {
      "n": 100,
      "solved": 0,
      "solveRate": 0,
      "violations": 0
    }
  }
}
```
- 产出文档:
  - `docs/notes/m2.md` —
  - `docs/notes/m3.md` —
  - `docs/forcing-boundary.md` —
  - `docs/flow.md` —
- 指标(cost / runtime / tokens,来自各 attempt 日志的 step_finish):
  - m2: `{"milestone":"m2","status":"FAIL","attempts":3,"activeSec":10,"cost":0,"steps":0,"tokens":{"input":0,"output":0,"reasoning":0,"cacheRead":0,"cacheWrite":0}}`
- 日志:`sudoku-wt/logs/minimax-m27/`(pipeline.log + 各 attempt 的 opencode JSON)

## glm51  (`alibaba-cn/glm-5.1`)

- M2: **PASS**   M3: **PASS**
- 引擎裁判(当前 worktree 状态):
```json
{
  "strategies": 17,
  "strategyIds": [
    "full-house",
    "naked-single",
    "hidden-single",
    "locked-candidates",
    "naked-subset",
    "hidden-subset",
    "basic-fish",
    "single-digit-patterns",
    "xy-wing",
    "xyz-wing",
    "w-wing",
    "simple-coloring",
    "aic",
    "als",
    "uniqueness",
    "sue-de-coq",
    "forcing-chain"
  ],
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
      "solved": 83,
      "solveRate": 0.83,
      "violations": 0
    },
    "diabolical": {
      "n": 100,
      "solved": 9,
      "solveRate": 0.09,
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
- 指标(cost / runtime / tokens,来自各 attempt 日志的 step_finish):
  - m2: `{"milestone":"m2","status":"PASS","attempts":2,"activeSec":1708,"cost":2.1211,"steps":75,"tokens":{"input":563150,"output":36587,"reasoning":43274,"cacheRead":7960448,"cacheWrite":0}}`
  - m3: `{"milestone":"m3","status":"PASS","attempts":1,"activeSec":1790,"cost":3.5214,"steps":125,"tokens":{"input":919041,"output":74564,"reasoning":95,"cacheRead":14482304,"cacheWrite":0}}`
- ⚠️ 异常记录(notes):
    04:09:04 opencode TIMEOUT after 1800s (attempt killed) -> m3-attempt-1.log
- 日志:`sudoku-wt/logs/glm51/`(pipeline.log + 各 attempt 的 opencode JSON)

## kimi-k26  (`alibaba-cn/kimi-k2.6`)

- M2: **PASS**   M3: **PASS**
- 引擎裁判(当前 worktree 状态):
```json
{
  "strategies": 17,
  "strategyIds": [
    "full-house",
    "naked-single",
    "hidden-single",
    "locked-candidates",
    "naked-subset",
    "hidden-subset",
    "basic-fish",
    "single-digit-patterns",
    "xy-wing",
    "xyz-wing",
    "w-wing",
    "simple-coloring",
    "aic",
    "als",
    "uniqueness",
    "sue-de-coq",
    "forcing-chain"
  ],
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
      "solved": 98,
      "solveRate": 0.98,
      "violations": 0
    },
    "diabolical": {
      "n": 100,
      "solved": 60,
      "solveRate": 0.6,
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
- 指标(cost / runtime / tokens,来自各 attempt 日志的 step_finish):
  - m2: `{"milestone":"m2","status":"PASS","attempts":1,"activeSec":1240,"cost":0.3553,"steps":61,"tokens":{"input":185820,"output":32324,"reasoning":15023,"cacheRead":4904576,"cacheWrite":0}}`
  - m3: `{"milestone":"m3","status":"PASS","attempts":1,"activeSec":1789,"cost":0.4327,"steps":107,"tokens":{"input":192910,"output":44817,"reasoning":20896,"cacheRead":11609600,"cacheWrite":0}}`
- ⚠️ 异常记录(notes):
    04:59:58 opencode TIMEOUT after 1800s (attempt killed) -> m3-attempt-1.log
- 日志:`sudoku-wt/logs/kimi-k26/`(pipeline.log + 各 attempt 的 opencode JSON)

