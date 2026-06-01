# 数独交互式教程 —— 需求文档

## 1. 背景与目的

第 1 阶段已完成:仓库内已有较完备的"人类数独解法"研究库
(`research/sudoku-human-solving/`,56 个来源、13 张技巧卡、中英术语表、JSON 索引),
并备有 `./puzzles` 下 ~27,800 道 OpenSudoku 格式谜题(easy/medium/hard/diabolical 四档,**不含答案**)。

本文件定义在研究库之上要构建的产品:一个**数独交互式教程**——
能用人类解法(非暴力枚举)系统化地求解数独,逐步可视化解题过程,并交互式引导用户学习各种策略。

**已确定的核心决策:**

| 决策项 | 结论 |
|---|---|
| 技术栈 | **TypeScript 全栈**(求解引擎可在 Node 测试、在浏览器直接复用) |
| 求解深度 | **全难度**,含 AIC、ALS、链(chains / forcing chains) |
| 流程交付形态 | **可执行算法为主 + 由其派生的人读文档** |

**核心架构原则(贯穿全文):SolveTrace 脊柱。**
求解器不仅输出答案,而输出一份结构化的解题轨迹 **SolveTrace**;
一份 trace 三处复用——正确性验证、网页逐步回放、交互式提示。
这是把后续各阶段串起来的唯一数据契约。

---

## 2. 目标与非目标

### 2.1 目标
- 用人类可理解的逻辑策略求解标准 9×9 数独,覆盖从入门到 diabolical 的难度。
- 把"系统化解题流程"沉淀为**可执行的策略排序 + 决策逻辑**,并派生人读文档。
- 用 `./puzzles` 全量语料验证流程的解出率与正确性。
- 提供网页逐步回放完整解题过程。
- 提供从任意盘面出发的交互式引导(分级提示、落子校验、错误讲解)。

### 2.2 非目标(本期不做)
- 非标准变体数独(对角线、杀手、不规则宫等)。
- 暴力回溯作为"教学解法"展示(暴力求解器仅用于生成标准答案与唯一性校验)。
- 谜题生成器、用户账户系统、排行榜、移动端原生 App。
- 多语言超出中 / 英(术语以现有 `glossary.zh-en.md` 为准)。

---

## 3. 用户与使用场景

主要使用者:想**学习并训练人类数独解法**的爱好者(覆盖新手到进阶)。

- **学习场景**:看引擎对一道题的完整逐步解法,理解每步用了什么技巧、为什么成立。
- **训练场景**:自己解题卡住时,从当前盘面请求**渐进式提示**(先提示技巧类别 → 再提示区域 → 最后给出确切一步)。
- **校验场景**:落子后由引擎判断对错,错误时解释原因。

---

## 4. 功能需求

### 4.1 求解引擎(核心,纯 TS、无 DOM)
- **FR-1 盘面模型**:81 格,候选数用 bitmask;预计算 houses(行 / 列 / 宫)与 peers。
- **FR-2 谜题解析**:解析 `./puzzles` 的 OpenSudoku XML(81 字符串,0 = 空)。
- **FR-3 暴力校验器**:DLX / 回溯,生成 ground-truth 解并判定唯一解(**仅供验证,不作教学**)。
- **FR-4 人类策略库**(全难度,分层):
  - **T1**:full house、naked single、hidden single
  - **T2**:locked candidates(pointing / claiming)、naked / hidden pairs / triples / quads
  - **T3**:基础鱼(X-Wing / Swordfish / Jellyfish,统一用 base/cover 集合模型)、
    单数字模式(skyscraper / 2-string kite / empty rectangle)、wings(XY / XYZ / W-Wing)
  - **T4**:简单染色 → **强弱链接图 + AIC 引擎**(named 技巧视为其特例)→
    ALS-XZ / ALS 链 / Death Blossom → 唯一性(UR / BUG,标记 optional)→ Sue de Coq → forcing chains
  - 规则来源:`research/sudoku-human-solving/local-library/techniques/` 13 张技巧卡。
- **FR-5 主求解循环**:按策略顺序尝试,取首个产出步骤并应用,记录为一个 Step,循环至解出或卡死。
- **FR-6 SolveTrace 输出**:产出完整轨迹(见 §6 数据规格)。

### 4.2 系统化流程(算法 + 文档)
- **FR-7 流程即策略排序**:主循环的策略顺序就是"系统化流程"本体;便宜策略优先、昂贵链类后置。
- **FR-8 forcing-chain 边界规则**:成文定义何种深度 / 分叉的链算"人类可接受逻辑",超出即判为枚举并标记
  (解决研究库 `findings.md` 标注的未决问题)。
- **FR-9 派生文档**:由策略注册表 + 代表性 worked trace 派生人读流程文档(算法与文档同源,避免脱节)。

### 4.3 网页逐步回放(阶段 4)
- **FR-10**:加载谜题 → 引擎产出 SolveTrace → 候选数网格渲染。
- **FR-11**:逐步浏览(上一步 / 下一步),高亮当前 Step 的格 / 候选 / 链路径。
- **FR-12**:双语讲解面板(复用 `glossary.zh-en.md` 术语)。
- 直接 import 引擎包,无需后端。

### 4.4 交互式引导 UI(阶段 5)
- **FR-13 任意盘面输入**:支持用户输入或部分填写的盘面。
- **FR-14 渐进式提示**:对当前盘面求"下一可行 Step",分三级披露:技巧类别 → 关注区域 → 确切一步。
- **FR-15 落子校验**:用户落子后判定对错;错误时给出原因解释。
- **FR-16 复用**:与回放共用 SolveTrace / Step 结构与渲染组件。

---

## 5. 非功能需求

- **NFR-1 正确性(最高优先)**:引擎走的每一步,绝不能消除真解中的候选、绝不能填错数字
  ——用 ground-truth 自动校验(详见 §8 验收)。这把"教学求解器"与"会猜错的求解器"严格区分。
- **NFR-2 性能**:单题求解应在交互可接受时延内完成(回放 / 提示为人机交互场景);
  全量语料批量验证应能在合理时间跑完(可批处理)。
- **NFR-3 可维护性**:每个策略为独立纯函数,单元可测;新增策略不影响既有策略。
- **NFR-4 复用性**:引擎为无 DOM 的纯 TS 包,Node 与浏览器共用同一份代码。
- **NFR-5 双语**:所有面向用户的讲解中英双语,术语统一自现有 glossary。

---

## 6. 数据规格:SolveTrace 脊柱(需先定稿)

```ts
interface Link { /* 强/弱链接,用于 AIC/链可视化 */ }

interface Step {
  strategyId: string;                 // 'naked-single' | 'x-wing' | 'aic' ...
  placements: { cell: number; digit: number }[];     // 填入
  eliminations: { cell: number; digit: number }[];   // 消除候选
  highlights: {
    cells: number[];
    candidates: { cell: number; digit: number }[];
    links: Link[];                    // 链路径,供 UI 高亮
  };
  explanation: { zh: string; en: string };
  // 仅存增量;回放时从初始盘面累积重建,不存全量快照
}

interface SolveTrace {
  initial: Grid;
  steps: Step[];
  outcome: 'solved' | 'stuck';
}
```

---

## 7. 技术约束与选型

- **TypeScript 全栈**;构建 / 测试建议 Vite + Vitest;monorepo(`engine` / `web` 两包)。
- 目录建议:

  ```
  packages/engine/   纯 TS:grid / parser / bruteforce / trace / strategies / solver
  packages/web/      Vite + TS:replay(阶段4) / tutor(阶段5),直接 import engine
  data/              生成物:ground-truth 解、难度→策略映射、worked examples
  docs/              由策略注册表 + worked trace 派生的人读流程文档
  ```

- 复用现有资产:技巧卡(规则来源)、glossary(术语)、puzzles(测试语料)。

---

## 8. 验收标准

- **AC-1**:能加载四档谜题并由暴力校验器产出全量 ground-truth 解集。
- **AC-2**:每个已实现策略有单元测试,用已知最小盘面断言精确产出。
- **AC-3(健全性回归)**:对所有唯一解谜题,引擎全程不产生与真解矛盾的步骤(自动校验通过)。
- **AC-4**:按难度报告引擎非暴力解出率;diabolical 档可验证 AIC / ALS 生效。
- **AC-5**:网页回放能逐步展示任一题的完整 SolveTrace,高亮与双语讲解正确。
- **AC-6**:交互 UI 能对任意盘面给出分级提示,并正确校验用户落子(可用浏览器 MCP 走查)。

---

## 9. 待准备资料 / 开放问题

1. **Worked examples(分步范例)**:为每个技巧挑 2~3 道该技巧决定性的题
   (`findings.md` 第 82 行已自标为研究库最后缺口)——随策略实现产出。
2. **Ground-truth 解集**:谜题唯一解,作回归基准——自动生成。
3. **难度→策略映射**:各难度需哪些策略才能解开——跑全量语料生成。
4. **forcing-chain 边界成文规则**——见 FR-8,需在实现链类策略前定稿。
5. (按需)中文讲解文案补充:glossary 58 词做 UI 标签够用,但教程长文案可能要扩写。

---

## 10. 交付与里程碑(建议顺序)

| 里程碑 | 内容 | 对应需求 |
|---|---|---|
| M1 地基 | 盘面模型 + OpenSudoku 解析 + 暴力校验 / 标准答案 + SolveTrace 类型定稿 | FR-1~3、FR-6、AC-1 |
| M2 基础策略 | T1~T3 策略 + 单元测试 + 健全性回归 + 全量解出率统计 | FR-4(T1-3)、FR-5、FR-7、AC-2~4 |
| M3 高级策略 | T4(AIC / ALS / 链 / 唯一性 / forcing)+ 边界规则 + 派生文档 | FR-4(T4)、FR-8、FR-9 |
| M4 回放 | 网页逐步回放 | FR-10~12、AC-5 |
| M5 交互引导 | 任意盘面提示 + 落子校验 | FR-13~16、AC-6 |

> **风险隔离**:全项目 ~80% 工程量集中在 M3 的 AIC / ALS 链接图;M1 + M2 先跑通端到端最小闭环
> (能解 easy~hard、有 trace、有健全性回归),再以可插拔模块接入 M3。
