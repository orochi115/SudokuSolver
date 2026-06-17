// gen-report.mjs  [models-file]
//
// Generates a self-contained comparison report (orchestration/round1/report-final.md):
//   - environment info (OS, opencode, node, toolchain) for reproducibility,
//   - per-model results table (solve-rates as %, columns that are constant
//     across all models are dropped and noted),
//   - per-model skill/tool usage (what each model actually invoked),
//   - failures + reproduction instructions.
//
// Data sources: reports/status/<name>.tsv, the judge run live per worktree,
// sudoku-wt/logs/<name>/<ms>.metrics.json, and tool_use events in the logs.
import { execSync } from 'node:child_process';
import { readFileSync, readdirSync, existsSync, writeFileSync, copyFileSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const WT_LOGS = resolve(REPO, '../sudoku-wt/logs');
const WT_ROOT = resolve(REPO, '../sudoku-wt');
const MODELS_FILE = process.argv[2] || resolve(REPO, 'orchestration/round1/models.txt');
const JUDGE = resolve(REPO, 'orchestration/harness/judge/verify-engine.ts');

const sh = (cmd) => { try { return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { return '?'; } };
const readJSON = (p) => { try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return null; } };
const lines = (p) => { try { return readFileSync(p, 'utf8').split('\n').filter((l) => l.trim() && !/^\s*#/.test(l)); } catch { return []; } };

// ---- environment ----
const lock = readJSON(resolve(REPO, 'package-lock.json'))?.packages ?? {};
const dep = (n) => lock[`node_modules/${n}`]?.version ?? '?';
const env = {
  os: `${sh('sw_vers -productName')} ${sh('sw_vers -productVersion')} (${sh('uname -m')}, Darwin ${sh('uname -r')})`,
  opencode: sh('opencode --version'),
  node: process.version,
  npm: sh('npm -v'),
  python3: sh('python3 --version'),
  gitlfs: sh('git lfs version').split(' ')[0],
  tsx: dep('tsx'), typescript: dep('typescript'), vitest: dep('vitest'), nodeTypes: dep('@types/node'),
};

// ---- required ids (for "missing" computation) ----
const requiredM3 = lines(resolve(REPO, 'orchestration/harness/required-ids/m3.txt')).map((s) => s.trim());

// ---- per-model collection ----
const models = lines(MODELS_FILE).map((l) => { const [m, n] = l.split(/\s+/); return { model: m, name: n }; });

function judge(wt) {
  if (!existsSync(wt)) return null;
  const tmp = resolve(wt, '.genreport-judge.ts');
  try {
    copyFileSync(JUDGE, tmp);
    let out;
    try {
      out = execSync('npx tsx .genreport-judge.ts', { cwd: wt, encoding: 'utf8', env: { ...process.env, REQUIRE_IDS: requiredM3.join(' ') }, stdio: ['ignore', 'pipe', 'ignore'] });
    } catch (e) {
      out = e.stdout || ''; // GATE FAIL exits non-zero but still prints the JSON to stdout first
    }
    return JSON.parse(out);
  } catch { return null; } finally { try { rmSync(tmp); } catch {} }
}

function tools(name) {
  const dir = resolve(WT_LOGS, name);
  const cnt = {};
  if (!existsSync(dir)) return cnt;
  for (const f of readdirSync(dir).filter((x) => /-attempt-\d+\.log$/.test(x))) {
    for (const line of readFileSync(resolve(dir, f), 'utf8').split('\n')) {
      if (!line.includes('"tool_use"')) continue;
      let o; try { o = JSON.parse(line); } catch { continue; }
      const t = o.part?.tool; if (t) cnt[t] = (cnt[t] || 0) + 1;
    }
  }
  return cnt;
}

const rows = models.map(({ model, name }) => {
  const wt = resolve(WT_ROOT, name);
  const sf = resolve(REPO, 'orchestration/reports/status', `${name}.tsv`);
  const stxt = (() => { try { return readFileSync(sf, 'utf8'); } catch { return ''; } })();
  const m2 = (stxt.match(/m2\t(\w+)/) || [])[1] || '-';
  const m3 = (stxt.match(/m3\t(\w+)/) || [])[1] || '-';
  const j = judge(wt);
  const r = j?.report ?? {};
  const ids = j?.strategyIds ?? [];
  const missing = requiredM3.filter((id) => !ids.includes(id));
  const m2m = readJSON(resolve(WT_LOGS, name, 'm2.metrics.json')) || {};
  const m3m = readJSON(resolve(WT_LOGS, name, 'm3.metrics.json')) || {};
  const cost = Number(((m2m.cost || 0) + (m3m.cost || 0)).toFixed(2));
  const mins = Math.round(((m2m.activeSec || 0) + (m3m.activeSec || 0)) / 60);
  return {
    name, model, m2, m3,
    strategies: j?.strategies ?? '-',
    easy: r.easy?.solveRate, medium: r.medium?.solveRate, hard: r.hard?.solveRate, diabolical: r.diabolical?.solveRate,
    violations: j?.totalViolations,
    cost, mins,
    att: `${m2m.attempts ?? '-'}/${m3m.attempts ?? '-'}`,
    missing,
    tools: tools(name),
  };
});

// ---- formatting helpers ----
const pct = (v) => (v == null ? '-' : `${Math.round(v * 100)}%`);
const allSame = (vals) => vals.every((v) => v === vals[0]);

// candidate columns; drop a solve-rate/violations column if constant across all rows
const cols = [];
const add = (key, header, fmt) => cols.push({ key, header, fmt });
add('m2', 'M2', (r) => r.m2);
add('m3', 'M3', (r) => r.m3);
add('strategies', 'strat', (r) => String(r.strategies));
for (const k of ['easy', 'medium', 'hard', 'diabolical']) add(k, k, (r) => pct(r[k]));
add('violations', 'viol', (r) => String(r.violations ?? '-'));
add('cost', 'cost$', (r) => `$${r.cost}`);
add('mins', 'min', (r) => String(r.mins));
add('att', 'att(m2/m3)', (r) => r.att);

// Drop any column whose value is identical across all models (note it instead).
const dropped = [];
const keptCols = cols.filter((c) => {
  const vals = rows.map((r) => c.fmt(r));
  if (rows.length > 1 && allSame(vals)) {
    dropped.push(`${c.header} = ${vals[0]}`);
    return false;
  }
  return true;
});

// ---- emit markdown ----
const ts = sh('date "+%Y-%m-%d %H:%M:%S %z"');
let md = '';
md += `# 数独求解引擎 · 多模型横评报告\n\n`;
md += `> 生成时间:${ts}。固定范围对比:所有模型须实现同一套必需策略(\`orchestration/harness/required-ids/\`),\n`;
md += `> 健全性(0 violation)为硬门槛,解出率/成本/耗时仅收集用于对比实现质量。\n\n`;

md += `## 环境(便于复现)\n\n`;
md += `| 项 | 版本 |\n|---|---|\n`;
md += `| OS | ${env.os} |\n| opencode | ${env.opencode} |\n| Node | ${env.node} |\n| npm | ${env.npm} |\n`;
md += `| TypeScript | ${env.typescript} |\n| tsx | ${env.tsx} |\n| Vitest | ${env.vitest} |\n| @types/node | ${env.nodeTypes} |\n`;
md += `| Git LFS | ${env.gitlfs} |\n| python3 | ${env.python3} (未用于引擎,仅记录) |\n\n`;

md += `## 结果对比\n\n`;
md += `| 模型 | ${keptCols.map((c) => c.header).join(' | ')} |\n`;
md += `|---|${keptCols.map(() => '---').join('|')}|\n`;
for (const r of rows) md += `| \`${r.model}\` | ${keptCols.map((c) => c.fmt(r)).join(' | ')} |\n`;
md += `\n`;
if (dropped.length) md += `> 已省略所有模型取值相同的列:${dropped.join(';')}。\n\n`;
md += `> 解出率按 100 题/档计;\`att\` 为 M2/M3 各自的尝试次数;\`min\`/\`cost\` 为 M2+M3 合计(模型活跃时长 / token 成本,订阅制模型成本可能为 0)。\n\n`;

const failed = rows.filter((r) => r.m2 === 'FAIL' || r.m3 === 'FAIL' || (r.missing && r.missing.length));
if (failed.length) {
  md += `## 失败 / 未达标\n\n`;
  for (const r of failed) {
    md += `- **${r.name}** (\`${r.model}\`):M2=${r.m2} M3=${r.m3}`;
    if (r.violations) md += `,健全性违例 ${r.violations}`;
    if (r.missing?.length) md += `,缺失必需策略 ${r.missing.length} 个:${r.missing.join(', ')}`;
    md += `\n`;
  }
  md += `\n`;
}

md += `## 各模型实际使用的工具/技能\n\n`;
md += `> 来自各 attempt 日志的 \`tool_use\` 事件(工具名: 调用次数)。\n\n`;
for (const r of rows) {
  const entries = Object.entries(r.tools).sort((a, b) => b[1] - a[1]);
  md += `- **${r.name}**: ${entries.length ? entries.map(([t, n]) => `${t}×${n}`).join(', ') : '(无记录)'}\n`;
}
md += `\n`;

md += `## 复现方法\n\n`;
md += `1. 配好 opencode 及各 provider 凭据;\`git lfs pull\` 拉取谜题。\n`;
md += `2. 编辑 \`orchestration/round1/models.txt\`(provider/model + 短名)。\n`;
md += `3. \`TIMEOUT=3600 MAX_PAR=4 orchestration/harness/run-all.sh\`(Bedrock/alibaba-cn 自动串行)。\n`;
md += `4. \`node orchestration/harness/gen-report.mjs\` 生成本报告。\n`;
md += `5. 必需策略范围见 \`orchestration/harness/required-ids/{m2,m3}.txt\`;评分口径见本仓库 orchestration/。\n`;

writeFileSync(resolve(REPO, 'orchestration/round1/report-final.md'), md);
console.log('wrote orchestration/round1/report-final.md');
console.log(`models: ${rows.length}, dropped constant cols: ${dropped.join(' | ') || 'none'}`);
