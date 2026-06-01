# Forcing Chain Boundary (FR-8)

本文定义引擎中 `forcing-chain` 的可接受边界,目标是保留可解释的人类链式逻辑,避免“伪装枚举”。

## 1) 允许的链

- 单一前提链:从一个候选的真假假设出发,沿强/弱链接推演。
- 线性路径:每个结论都来自上一跳的蕴含,最终给出单一矛盾或单一定值。
- 限深:链长受 `maxChainLength` 限制(默认 12)。
- 链路类型:仅使用候选图中的强/弱链接(同格互斥、同宫同数字互斥、共轭强链、双值格强链)。

## 2) 禁用/标记为越界的形态

- 多分叉 forcing nets(默认禁用):不允许把同一步骤建立在并行分支树上。
- Nishio 式试填回溯:不允许完整分支搜索后择优回填。
- 模板枚举/全局模式枚举:不允许对全盘模板做穷举筛除。

## 3) 引擎配置暴露

策略边界通过 `packages/engine/src/strategy-options.ts` 暴露:

- `forcingBoundary.maxChainLength`:链最大长度。
- `forcingBoundary.allowBranching`:是否允许分叉搜索(默认 `false`)。

示例:

```ts
import { setStrategyOptions } from '@sudoku/engine';

setStrategyOptions({
  forcingBoundary: {
    maxChainLength: 10,
    allowBranching: false,
  },
});
```

## 4) 当前默认策略立场

- 默认坚持“人类可解释链”:`allowBranching=false`。
- `forcing-chain` 仅在前序策略无步可走时触发(难度 100)。
- 默认不把分叉网与模板枚举混入正常教学流。
