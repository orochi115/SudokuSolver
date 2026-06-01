<!-- Questions that arose during implementation of M2. No response needed — decisions documented in docs/notes/m2.md. -->

1. T3 Empty Rectangle：标准实现需要宫内候选数形成"L/十字形"，但具体几种 cover 方向是否都需要支持？选择方案：同时检测行向强链（外部强链在 erRow 方向）和列向强链（外部强链在 erCol 方向），覆盖两种方向。

2. Skyscraper 是否应同时检测行向和列向两种方向？选择方案：是的，分别对"行对共享列"和"列对共享行"两种情形进行检测。

3. 对于 Diabolical 档，T1-T3 解出率为 7%，是否需要在 M2 中增加简单染色（Simple Coloring）来提升？选择方案：按任务描述，Simple Coloring 属于 T4（M3），本次不实现。

4. solve-rate 脚本是否应使用 puzzles/ 全量语料（~27,800 题）还是仅 data/ground-truth/（400 题）？选择方案：根据 M2.md 要求"对 data/ground-truth/ 各档跑 solve()"，使用 400 题的 ground-truth 数据。
