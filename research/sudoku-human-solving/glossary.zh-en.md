# Sudoku Terminology Glossary 中文/English

| English | 中文建议译名 | Also Seen | Notes |
|---|---|---|---|
| Cell | 单元格 | 格子 | One square in the grid |
| House | 单元/房屋 | 行列宫之一 | Row, column, or box |
| Row | 行 | 横行 | 9 cells horizontally |
| Column | 列 | 纵列 | 9 cells vertically |
| Box | 宫 | 九宫格、3x3宫 | 3x3 block |
| Candidate | 候选数 | 笔记、标记 | Possible digit in an empty cell |
| Peer / See | 影响/可见 | 看见 | Two cells share a house |
| Full House | 全屋唯一 | 最后一格 | Last empty cell in a house |
| Naked Single | 显性唯一 | 裸单、唯一余数 | Cell has one candidate |
| Hidden Single | 隐性唯一 | 唯一候选 | Digit has one possible cell in a house |
| Locked Candidates | 区块排除 | 区块锁定、行列消除 | Pointing and claiming |
| Pointing Pair/Triple | 指向数对/三数组 | 宫区块数对/三数组 | Box candidates restricted to one line |
| Claiming | 声明/占位排除 | 行列宫区块排除 | Line candidates restricted to one box |
| Naked Pair | 显性数对 | 裸对 | 2 cells contain 2 candidates |
| Hidden Pair | 隐性数对 | 隐藏对 | 2 digits confined to 2 cells |
| Naked Triple | 显性三数组 | 裸三 | 3 cells contain 3 candidates |
| Hidden Triple | 隐性三数组 | 隐藏三 | 3 digits confined to 3 cells |
| Naked Quad | 显性四数组 | 裸四 | 4 cells contain 4 candidates |
| Hidden Quad | 隐性四数组 | 隐藏四 | 4 digits confined to 4 cells |
| Fish | 鱼 | 鱼类技巧 | Single-digit base/cover-set pattern |
| X-Wing | X翼 | X-Wing | Size-2 basic fish |
| Swordfish | 剑鱼 | Swordfish | Size-3 basic fish |
| Jellyfish | 水母 | Jellyfish | Size-4 basic fish |
| Finned Fish | 有鳍鱼 | 带鳍鱼 | Fish with fins |
| Sashimi Fish | 生鱼片鱼 | Sashimi | Degenerate/incomplete finned fish |
| Skyscraper | 摩天楼 | Skyscraper | Short X-chain / Turbot pattern |
| 2-String Kite | 双线风筝 | 风筝 | Short X-chain / Turbot pattern |
| Empty Rectangle | 空矩形 | ER | Box-line single-digit pattern |
| Turbot Fish | 多宝鱼 | 双强链 | 4-candidate X-chain |
| Remote Pair | 远程数对 | Remote Pair | Chain of same bivalue pair |
| X-Chain | X链 | 单数字链 | Chain using one digit |
| XY-Chain | XY链 | 双值格链 | Chain of bivalue cells |
| XY-Wing | XY翼 | Y翼 | Short XY-chain with pivot and pincers |
| XYZ-Wing | XYZ翼 | XYZ-Wing | XY-Wing with trivalue pivot |
| W-Wing | W翼 | W-Wing | Same bivalue pair bridged by strong link |
| Coloring | 染色法 | 着色法 | Visual chain method |
| Strong Link | 强链 | 强关系 | Cannot both be false |
| Weak Link | 弱链 | 弱关系 | Cannot both be true |
| AIC | 交替推理链 | 强弱交替链 | Alternating Inference Chain |
| Nice Loop | 佳环 | Nice Loop | Loop form of alternating chain |
| Grouped Link | 分组链 | 区块节点 | Link between candidate groups |
| ALS | 几乎锁定集 | Almost Locked Set | N cells with N+1 candidates |
| RCC | 受限公共候选 | Restricted Common Candidate | Common candidate where all instances see each other |
| ALS-XZ | ALS-XZ | 几乎锁定集XZ | Two ALS connected by RCC |
| Death Blossom | 死亡花 | Death Blossom | Stem plus ALS petals |
| Unique Rectangle | 唯一矩形 | UR | Uniqueness-based deadly-pattern technique |
| Deadly Pattern | 致命结构 | 致命形态 | Would imply multiple solutions |
| BUG+1 | BUG+1 | 全双值格致死 | Bivalue Universal Grave plus one extra |
| Sue de Coq | Sue de Coq | 双区域不交数组 | Subset-counting technique |
| Forcing Chain | 强制链 | 试链、强迫链 | Multiple implications proving verity/contradiction |
| Forcing Net | 强制网 | 分支链网 | Branching implication network |
| Nishio | Nishio | 单数字试误 | Single-digit contradiction method |
| Brute Force | 暴力搜索 | 回溯枚举 | Outside target human workflow |
