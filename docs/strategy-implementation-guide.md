# 策略实现指南（地基可复用框架）

> 本文档面向在本引擎上**新增人类解法策略**的实现者。地基已有 33 个策略与一套链/鱼/唯一性引擎；
> **优先复用现有机制**，不要为已有家族另起炉灶。先读本指南再动手，可少走弯路、避免不健全实现。

## 契约与注册（必读）
- `packages/engine/src/strategy.ts` — `Strategy` 接口。每个策略是**纯函数**：`apply(grid)` 返回首个可行 `Step` 或 `null`，**绝不修改 grid**。
- `packages/engine/src/strategies/index.ts` — `STRATEGIES`（按 `difficulty` 升序）与 `CANONICAL_STRATEGY_ORDER`。新增策略要**同时**加入两者且保持一致；`difficulty` 互不重复（`strategy-profiles.test.ts` 会校验）。
- `packages/engine/src/strategies/profiles.ts` — `LAST_RESORT_IDS`。**只有** forcing/枚举类（P3）才加进这里；human-default = 全集减 last-resort。
- `packages/engine/src/strategies/overlap.ts` — 家族归属。复用型新 id（如 turbot-fish 复用 x-chain）要从 `futureMembers` 移入 `members`，**不要新写搜索**。
- `packages/engine/src/chain/boundaries.ts` — 链引擎归属（x-chain/aic/nice-loop/xy-chain；forcing 仅 last-resort、`multiBranch:true`）。

## 可复用引擎（不要重造）
- **链引擎**：`x-chain.ts` / `aic.ts` 里的 `buildLinkGraph`（强/弱链接图 + group node 开关）。XY-Chain / Nice Loop / Remote Pairs / AIC-with-* / Turbot 都是它的节点/呈现特例。
- **鱼**：`x-wing.ts`/`swordfish.ts`/`jellyfish.ts` 的 base/cover 模型；Finned/Sashimi/Franken/Mutant 是其扩展（加 fin / 扩 cover 域）。
- **唯一性**：现有 UR Type1/2/4 detector；UR3/5/6、Hidden UR、AR、EUR、BUG 变体应在共享 UR engine 上扩展。
- **ALS**：`als-xz`/`als-chain`；`als-xy-wing` 是 ALS 链的 len-2 特例。

## 健全性 = 红线
- `packages/engine/src/soundness.ts` 的 `checkTraceSoundness(trace, solution)` 对每步消去/落子核对真解。验收对 **400 题 ground-truth 与 727 残集逐步**校验，**任何非法消除直接判失败**。
- **禁止枚举伪装**：human-default 策略不得做试错/回溯/矛盾穷举；这类只能进 last-resort（P3）。
- **禁止用答案**：策略代码**绝不**调用 `solveBruteforce`/`countSolutions`/`findGroundTruth`（那是暴力 oracle，不是技巧）。

## TDD 与夹具
- 每个策略配 restored-state 单测：手工最小盘面或研究卡 worked example，断言精确产出 + 整题 sound 不回退。
- 研究卡与 worked example：`research/sudoku-human-solving/local-library/techniques/`（00–12 分册）；`packages/engine/test/worked-examples.test.ts` 可参考其断言写法。

## 进度量表
- `npm run solve:list -- --profile human-default`（727 残集，默认）/ `-- --profile last-resort`（含 P3）。每实现一族跑一次看 727 增量。
