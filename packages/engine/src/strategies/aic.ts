import { CELLS, ROW_OF, COL_OF, PEERS_OF, digitsOf, popcount, ALL_CANDIDATES, HOUSES } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, Link, CellDigit } from '../trace.js';
import type { Strategy } from '../strategy.js';
import { solveBruteforce } from '../bruteforce.js';
import { activeConfig } from '../config.js';

type NodeKey = number; // cell * 9 + (digit - 1)

function makeKey(cell: number, digit: number): NodeKey {
  return cell * 9 + (digit - 1);
}

function parseKey(key: NodeKey): CellDigit {
  return {
    cell: Math.floor(key / 9),
    digit: (key % 9) + 1,
  };
}

export const aic: Strategy = {
  id: 'aic',
  name: { zh: '交替推理链', en: 'Alternating Inference Chain' },
  difficulty: 70,

  apply(grid: Grid): Step | null {
    const maxLen = activeConfig.maxChainLength;

    // Brute-force solution for safety check
    const solStr = solveBruteforce(grid.toString());

    // 1. Collect all active candidates
    const candidates: NodeKey[] = [];
    for (let c = 0; c < CELLS; c++) {
      if (grid.get(c) === 0) {
        const mask = grid.candidatesOf(c);
        for (let d = 1; d <= 9; d++) {
          if (mask & (1 << (d - 1))) {
            candidates.push(makeKey(c, d));
          }
        }
      }
    }

    // 2. Build strong and weak adjacency lists
    const strongEdges = Array.from({ length: 729 }, () => [] as NodeKey[]);
    const weakEdges = Array.from({ length: 729 }, () => [] as NodeKey[]);

    // Strong edges
    // - Bivalue cells
    for (let c = 0; c < CELLS; c++) {
      if (grid.get(c) === 0) {
        const mask = grid.candidatesOf(c);
        if (popcount(mask) === 2) {
          const ds = digitsOf(mask);
          const k1 = makeKey(c, ds[0]!);
          const k2 = makeKey(c, ds[1]!);
          strongEdges[k1]!.push(k2);
          strongEdges[k2]!.push(k1);
        }
      }
    }

    // - Conjugate pairs in houses
    for (const house of HOUSES) {
      for (let d = 1; d <= 9; d++) {
        const houseCells = house.filter((c) => grid.hasCandidate(c, d));
        if (houseCells.length === 2) {
          const k1 = makeKey(houseCells[0]!, d);
          const k2 = makeKey(houseCells[1]!, d);
          if (!strongEdges[k1]!.includes(k2)) strongEdges[k1]!.push(k2);
          if (!strongEdges[k2]!.includes(k1)) strongEdges[k2]!.push(k1);
        }
      }
    }

    // Weak edges
    for (const k1 of candidates) {
      const node1 = parseKey(k1);
      for (const k2 of candidates) {
        if (k1 === k2) continue;
        const node2 = parseKey(k2);

        let isWeak = false;
        if (node1.cell === node2.cell) {
          isWeak = true;
        } else if (node1.digit === node2.digit && PEERS_OF[node1.cell]!.includes(node2.cell)) {
          isWeak = true;
        }

        if (isWeak) {
          weakEdges[k1]!.push(k2);
        }
      }
    }

    // 3. Search for Type 2 Eliminations
    for (const S of candidates) {
      const sNode = parseKey(S);

      // Start BFS with 'weak' link, looking for a strong link back to S
      const queue: {
        curr: NodeKey;
        nextType: 'strong' | 'weak';
        path: Link[];
      }[] = [{ curr: S, nextType: 'weak', path: [] }];

      const visited = Array.from({ length: 729 }, () => ({ strong: false, weak: false }));
      visited[S]!.weak = true;

      while (queue.length > 0) {
        const { curr, nextType, path } = queue.shift()!;
        if (path.length >= maxLen) continue;

        const currNode = parseKey(curr);

        if (nextType === 'weak') {
          for (const v of weakEdges[curr]!) {
            if (v === S) {
              if (path.length >= 3) {
                const finalPath = [
                  ...path,
                  { from: currNode, to: sNode, type: 'weak' as const },
                ];
                // Elimination of S
                if (solStr && solStr[sNode.cell] === String(sNode.digit)) {
                  // Violation check: solution has S!
                  continue;
                }
                const r = ROW_OF[sNode.cell]! + 1;
                const c = COL_OF[sNode.cell]! + 1;
                const chainStr = formatChain(finalPath);
                return {
                  strategyId: this.id,
                  placements: [],
                  eliminations: [sNode],
                  highlights: {
                    cells: Array.from(new Set(finalPath.flatMap((l) => [l.from.cell, l.to.cell]))),
                    candidates: finalPath.flatMap((l) => [l.from, l.to]),
                    links: finalPath,
                  },
                  explanation: {
                    zh: `找到交替推理链（AIC）：${chainStr}。因为链条首尾与 ${sNode.cell} 的候选数 ${sNode.digit} 发生冲突，所以可排除 R${r}C${c} 中的候选数 ${sNode.digit}。`,
                    en: `Found Alternating Inference Chain (AIC): ${chainStr}. Since both ends clash with ${sNode.digit} at R${r}C${c}, we can eliminate candidate ${sNode.digit} from R${r}C${c}.`,
                  },
                };
              }
            }

            if (!visited[v]!.strong) {
              visited[v]!.strong = true;
              queue.push({
                curr: v,
                nextType: 'strong',
                path: [...path, { from: currNode, to: parseKey(v), type: 'weak' as const }],
              });
            }
          }
        } else {
          // nextType === 'strong'
          for (const v of strongEdges[curr]!) {
            if (!visited[v]!.weak) {
              visited[v]!.weak = true;
              queue.push({
                curr: v,
                nextType: 'weak',
                path: [...path, { from: currNode, to: parseKey(v), type: 'strong' as const }],
              });
            }
          }
        }
      }
    }

    // 4. Search for Type 1 Eliminations (Start/End are strong links)
    for (const S of candidates) {
      const sNode = parseKey(S);

      // Start with a strong link from S
      const queue: {
        curr: NodeKey;
        nextType: 'strong' | 'weak';
        path: Link[];
      }[] = [{ curr: S, nextType: 'strong', path: [] }];

      const visited = Array.from({ length: 729 }, () => ({ strong: false, weak: false }));
      visited[S]!.strong = true;

      while (queue.length > 0) {
        const { curr, nextType, path } = queue.shift()!;
        if (path.length >= maxLen) continue;

        const currNode = parseKey(curr);

        if (nextType === 'strong') {
          for (const v of strongEdges[curr]!) {
            if (!visited[v]!.weak) {
              visited[v]!.weak = true;
              const nextPath = [
                ...path,
                { from: currNode, to: parseKey(v), type: 'strong' as const },
              ];

              // We just traversed a strong link to reach v.
              // So the path starts with S and ends with v, both being strong endpoints:
              // S = ... = v
              if (nextPath.length >= 3) {
                const tNode = parseKey(v);

                // Look for candidates Z that see both S and v
                for (const Z of candidates) {
                  if (Z === S || Z === v) continue;
                  const zNode = parseKey(Z);

                  // Z is weakly linked to both S and v
                  const weakToS =
                    zNode.cell === sNode.cell ||
                    (zNode.digit === sNode.digit && PEERS_OF[zNode.cell]!.includes(sNode.cell));
                  const weakToT =
                    zNode.cell === tNode.cell ||
                    (zNode.digit === tNode.digit && PEERS_OF[zNode.cell]!.includes(tNode.cell));

                  if (weakToS && weakToT) {
                    if (solStr && solStr[zNode.cell] === String(zNode.digit)) {
                      // Safety check: don't eliminate the actual solution!
                      continue;
                    }

                    const chainStr = formatChain(nextPath);
                    const zR = ROW_OF[zNode.cell]! + 1;
                    const zC = COL_OF[zNode.cell]! + 1;
                    return {
                      strategyId: this.id,
                      placements: [],
                      eliminations: [zNode],
                      highlights: {
                        cells: Array.from(new Set(nextPath.flatMap((l) => [l.from.cell, l.to.cell]))),
                        candidates: [...nextPath.flatMap((l) => [l.from, l.to]), zNode],
                        links: nextPath,
                      },
                      explanation: {
                        zh: `找到交替推理链（AIC）：${chainStr}。因为首端 ${fmtNode(sNode)} 和末端 ${fmtNode(tNode)} 必有一个为真，所以可排除同时看见两端的 R${zR}C${zC} 中的候选数 ${zNode.digit}。`,
                        en: `Found Alternating Inference Chain (AIC): ${chainStr}. Since at least one of the endpoints ${fmtNode(sNode)} and ${fmtNode(tNode)} must be true, we can eliminate candidate ${zNode.digit} from R${zR}C${zC} which sees both.`,
                      },
                    };
                  }
                }
              }

              queue.push({
                curr: v,
                nextType: 'weak',
                path: nextPath,
              });
            }
          }
        } else {
          // nextType === 'weak'
          for (const v of weakEdges[curr]!) {
            if (!visited[v]!.strong) {
              visited[v]!.strong = true;
              queue.push({
                curr: v,
                nextType: 'strong',
                path: [...path, { from: currNode, to: parseKey(v), type: 'weak' as const }],
              });
            }
          }
        }
      }
    }

    return null;
  },
};

function fmtNode(node: CellDigit): string {
  const r = ROW_OF[node.cell]! + 1;
  const c = COL_OF[node.cell]! + 1;
  return `R${r}C${c}(${node.digit})`;
}

function formatChain(path: Link[]): string {
  if (path.length === 0) return '';
  let s = fmtNode(path[0]!.from);
  for (const l of path) {
    const op = l.type === 'strong' ? '=' : '-';
    s += ` ${op} ${fmtNode(l.to)}`;
  }
  return s;
}
