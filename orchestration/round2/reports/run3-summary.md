# Round2 横评结果汇总（客观数据）

> 由 report.sh 生成。阶段链 P0→P1→P2a→P2b→E→P3（每模型独立链；soft-gate）。
> 结果：OK=软通过(sound+无污染,按727-delta评分) · STOP=硬失败(build/test/健全性/污染) · SKIP=前序STOP后跳过。
> 硬门：typecheck+test+400&727逐步健全性0violation+无human-default污染（+P3隔离）；required-ids缺失为软项(missing列)。
> 727 计数来自各阶段判官；费用/tokens 来自运行日志（grok/部分plan-based provider无费用字段→N/A）。
> 主观评测（文档/checklist勾选、P3是否污染human-default、策略排序合理性）见 EVAL-RUBRIC.md，另开会话执行。

| 模型 | runner | 阶段 | 结果 | 727(human) | 727(last) | 缺id数 | 污染警告 | 测试用时s | 用时s | 费用$ | tokens(in/out) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| gpt55 | opencode | p0 | OK | 14/727 | — | 0 | - | 379 | 1187 | 5.0378 | 319404/23685 |
| gpt55 | opencode | p1 | OK | 14/727 | — | 0 | - | 624 | 342 | 1.4171 | 89847/5839 |
| gpt55 | opencode | p2a | OK | 14/727 | — | 0 | - | 587 | 258 | 1.3742 | 105310/8944 |
| gpt55 | opencode | p2b | OK | 14/727 | — | 0 | - | 615 | 467 | 2.233 | 123778/11996 |
| gpt55 | opencode | e | OK | 14/727 | — | 0 | - | 488 | 223 | 0.84 | 60789/3413 |
| gpt55 | opencode | p3 | OK | 14/727 | 61/727 | 0 | - | 1742 | 5868.0 | 5.0702 | 349634/20412 |
| sonnet46 | opencode | p0 | OK | 7/727 | — | 0 | - | 236 | 1064 | 5.1711 | 77/40771 |
| sonnet46 | opencode | p1 | OK | 8/727 | — | 0 | ⚠ | 135 | 2582.0 | 6.9347 | 119/92285 |
| sonnet46 | opencode | p2a | OK | 8/727 | — | 7 | ⚠ | 263 | 123 | 1.5013 | 26/4382 |
| sonnet46 | opencode | p2b | OK | 8/727 | — | 14 | ⚠ | 145 | 325 | 2.0818 | 38/5748 |
| sonnet46 | opencode | e | OK | 8/727 | — | 0 | ⚠ | 121 | 1321 | 3.5898 | 78/27886 |
| sonnet46 | opencode | p3 | OK | 8/727 | 77/727 | 0 | ⚠ | 521 | 930 | 1.9562 | 44/19192 |
| sonnet46 | | _notes_ | e.md p1.md  | | | | | | | | |
| gemini35flash | opencode | p0 | OK | 17/727 | — | 0 | - | 559 | 1048 | 4.9141 | 942273/29833 |
| gemini35flash | opencode | p1 | OK | 45/727 | — | 0 | - | 398 | 3215 | 4.8067 | 1548882/18285 |
| gemini35flash | opencode | p2a | STOP | — | — | 0 | - | — | — | — | —/— |
| gemini35flash | opencode | p2b | SKIP | — | — | 0 | - | — | — | — | —/— |
| gemini35flash | opencode | e | SKIP | — | — | 0 | - | — | — | — | —/— |
| gemini35flash | opencode | p3 | SKIP | — | — | 0 | - | — | — | — | —/— |
| gemini35flash | | _notes_ | p2a.md  | | | | | | | | |
| deepseekv4 | opencode | p0 | OK | 2/727 | — | 0 | - | 166 | 1730 | 0.1098 | 660761/12681 |
| deepseekv4 | opencode | p1 | STOP | 2/727 | — | 19 | - | 191 | 6851 | 0.7017 | 4318738/96385 |
| deepseekv4 | opencode | p2a | SKIP | — | — | 0 | - | — | — | — | —/— |
| deepseekv4 | opencode | p2b | SKIP | — | — | 0 | - | — | — | — | —/— |
| deepseekv4 | opencode | e | SKIP | — | — | 0 | - | — | — | — | —/— |
| deepseekv4 | opencode | p3 | SKIP | — | — | 0 | - | — | — | — | —/— |
| deepseekv4 | | _notes_ | p0.md  | | | | | | | | |
| composer25 | grok | p0 | OK | 17/727 | — | 0 | - | 309 | 7696.0 | null | 11644/9424 |
| composer25 | grok | p1 | STOP | — | — | 0 | - | — | 8157 | null | 6012/4394 |
| composer25 | grok | p2a | SKIP | — | — | 0 | - | — | — | — | —/— |
| composer25 | grok | p2b | SKIP | — | — | 0 | - | — | — | — | —/— |
| composer25 | grok | e | SKIP | — | — | 0 | - | — | — | — | —/— |
| composer25 | grok | p3 | SKIP | — | — | 0 | - | — | — | — | —/— |
| devstral2 | opencode | p0 | STOP | /727 | — | 0 | - | 4 | 1666 | 2.4037 | 5924212/16999 |
| devstral2 | opencode | p1 | SKIP | — | — | 0 | - | — | — | — | —/— |
| devstral2 | opencode | p2a | SKIP | — | — | 0 | - | — | — | — | —/— |
| devstral2 | opencode | p2b | SKIP | — | — | 0 | - | — | — | — | —/— |
| devstral2 | opencode | e | SKIP | — | — | 0 | - | — | — | — | —/— |
| devstral2 | opencode | p3 | SKIP | — | — | 0 | - | — | — | — | —/— |
| grokbuild | grok | p0 | OK | 0/727 | — | 0 | - | 221 | 1127 | null | 1017/2279 |
| grokbuild | grok | p1 | OK | 0/727 | — | 0 | - | 219 | 1399 | null | 844/3117 |
| grokbuild | grok | p2a | OK | 0/727 | — | 0 | - | 199 | 826 | null | 690/2157 |
| grokbuild | grok | p2b | OK | 0/727 | — | 0 | ⚠ | 185 | 796 | null | 694/2036 |
| grokbuild | grok | e | OK | 0/727 | — | 0 | ⚠ | 176 | 806 | null | 761/2215 |
| grokbuild | grok | p3 | OK | 0/727 | 65/727 | 0 | - | 537 | 4157 | null | 4163/6330 |
| grokbuild | | _notes_ | p3.md  | | | | | | | | |
| minimax-m3 | opencode | p0 | OK | 7/727 | — | 0 | - | 200 | 3936.0 | 0 | 1288624/210986 |
| minimax-m3 | opencode | p1 | OK | 13/727 | — | 0 | - | 1220 | 7866 | 0 | 1090336/240452 |
| minimax-m3 | opencode | p2a | OK | 13/727 | — | 0 | ⚠ | 1539 | 2204 | 0 | 174005/44457 |
| minimax-m3 | opencode | p2b | STOP | 13/727 | — | 7 | ⚠ | 1668 | 1913 | 0 | 581087/30266 |
| minimax-m3 | opencode | e | SKIP | — | — | 0 | - | — | — | — | —/— |
| minimax-m3 | opencode | p3 | SKIP | — | — | 0 | - | — | — | — | —/— |
| glm52 | opencode | p0 | OK | 0/727 | — | 10 | - | 165 | 823 | 0.2123 | 141514/3216 |
| glm52 | opencode | p1 | OK | 21/727 | — | 0 | - | 256 | 3269 | 0.8061 | 279745/94206 |
| glm52 | opencode | p2a | OK | 21/727 | — | 7 | - | 274 | 1323 | 0.247 | 121286/17544 |
| glm52 | opencode | p2b | OK | 21/727 | — | 0 | - | 579 | 3395 | 0.5685 | 221596/58693 |
| glm52 | opencode | e | OK | 21/727 | — | 0 | - | 492 | 556 | 0.2518 | 128734/16256 |
| glm52 | opencode | p3 | OK | 21/727 | 118/727 | 0 | - | 1761 | 821 | 0.2828 | 99158/32714 |
| kimi-k27 | opencode | p0 | OK | 0/727 | — | 10 | - | 106 | 1402 | 0 | 347346/12616 |
| kimi-k27 | opencode | p1 | OK | 0/727 | — | 29 | - | 106 | 983 | 0 | 233609/8672 |
| kimi-k27 | opencode | p2a | OK | 14/727 | — | 0 | - | 318 | 1039.0 | 0 | 110080/14540 |
| kimi-k27 | opencode | p2b | OK | 14/727 | — | 7 | - | 352 | 526 | 0 | 188189/10364 |
| kimi-k27 | opencode | e | STOP | 139/727 | — | 0 | - | 1170 | 5418 | 0 | 966012/70037 |
| kimi-k27 | opencode | p3 | SKIP | — | — | 0 | - | — | — | — | —/— |
| qwen37max | opencode | p0 | OK | 7/727 | — | 0 | - | 185 | 1891 | 4.168 | 702152/25888 |
| qwen37max | opencode | p1 | OK | 7/727 | — | 19 | - | 97 | 126.0 | 0.999 | 300948/1965 |
| qwen37max | opencode | p2a | OK | 10/727 | — | 0 | - | 137 | 1652 | 5.8641 | 616096/42177 |
| qwen37max | opencode | p2b | OK | 10/727 | — | 0 | - | 548 | 1200 | 4.7676 | 527568/32796 |
| qwen37max | opencode | e | OK | 10/727 | — | 0 | - | 546 | 101 | 0.4217 | 126189/1054 |
| qwen37max | opencode | p3 | OK | 10/727 | 49/727 | 0 | - | 762 | 2259 | 6.3817 | 824562/44095 |
