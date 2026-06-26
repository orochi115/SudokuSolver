P1 实现过程中的问题与假设（自主执行，已按合理方案继续）：

1. Avoidable Rectangle 需要区分题目给定数字（givens）与后续推导出的填数。当前 Grid 不保留初始给定信息，因此无法直接判断 AR 的“给定角”。假设：在 Grid 上新增只读字段 `givens: Uint8Array`（0/1 标记初始 81 格是否为给定），由 `Grid.fromString` 初始化，并在 `clone()` 中保留。这是实现 AR Type 1–4 的最小地基改动；AR 仅读取该字段，不改变现有策略行为。
