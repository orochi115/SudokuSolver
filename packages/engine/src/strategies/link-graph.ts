/**
 * Link Graph — Strong/Weak inference graph for AIC building.
 *
 * Nodes: individual candidates or grouped candidate sets
 * Edges: strong links (if A false then B true) or weak links (if A true then B false)
 */

import { HOUSES, maskOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Link } from '../trace.js';

export type LinkType = 'strong' | 'weak';

export interface GraphNode {
  type: 'single';
  cell: number;
  digit: number;
}

export interface GraphLink {
  from: GraphNode;
  to: GraphNode;
  type: LinkType;
}

export class LinkGraph {
  private strongLinks: GraphLink[] = [];
  private weakLinks: GraphLink[] = [];
  private nodeMap: Map<string, GraphNode> = new Map();
  private adjacency: Map<string, GraphLink[]> = new Map();

  constructor() {}

  private nodeKey(cell: number, digit: number): string {
    return `${cell}:${digit}`;
  }

  getNode(cell: number, digit: number): GraphNode {
    const key = this.nodeKey(cell, digit);
    if (!this.nodeMap.has(key)) {
      const node: GraphNode = { type: 'single', cell, digit };
      this.nodeMap.set(key, node);
      this.adjacency.set(key, []);
    }
    return this.nodeMap.get(key)!;
  }

  addStrongLink(from: GraphNode, to: GraphNode): void {
    const link: GraphLink = { from, to, type: 'strong' };
    this.strongLinks.push(link);
    this.getAdjacency(from).push(link);
    this.getAdjacency(to).push(link);
  }

  addWeakLink(from: GraphNode, to: GraphNode): void {
    const link: GraphLink = { from, to, type: 'weak' };
    this.weakLinks.push(link);
    this.getAdjacency(from).push(link);
    this.getAdjacency(to).push(link);
  }

  getAdjacency(node: GraphNode): GraphLink[] {
    return this.adjacency.get(this.nodeKey(node.cell, node.digit)) ?? [];
  }

  getStrongLinks(): GraphLink[] {
    return this.strongLinks;
  }

  getWeakLinks(): GraphLink[] {
    return this.weakLinks;
  }

  getAllLinks(): GraphLink[] {
    return [...this.strongLinks, ...this.weakLinks];
  }

  buildFromGrid(grid: Grid): void {
    for (let digit = 1; digit <= 9; digit++) {
      const bit = maskOf(digit);

      for (const house of HOUSES) {
        const cellsWithDigit: number[] = [];
        for (const c of house) {
          if (grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0) {
            cellsWithDigit.push(c);
          }
        }

        if (cellsWithDigit.length === 2) {
          const node1 = this.getNode(cellsWithDigit[0]!, digit);
          const node2 = this.getNode(cellsWithDigit[1]!, digit);
          this.addStrongLink(node1, node2);
          this.addStrongLink(node2, node1);
        } else if (cellsWithDigit.length > 2) {
          for (let i = 0; i < cellsWithDigit.length; i++) {
            for (let j = i + 1; j < cellsWithDigit.length; j++) {
              const node1 = this.getNode(cellsWithDigit[i]!, digit);
              const node2 = this.getNode(cellsWithDigit[j]!, digit);
              this.addWeakLink(node1, node2);
              this.addWeakLink(node2, node1);
            }
          }
        }
      }
    }
  }
}

export interface AICChain {
  nodes: GraphNode[];
  links: GraphLink[];
  isContinuous: boolean;
  isLoop: boolean;
}

function nodeKeyFromNode(node: GraphNode): string {
  return `${node.cell}:${node.digit}`;
}

function checkContinuity(existingLinks: GraphLink[], newLink: GraphLink): boolean {
  if (existingLinks.length === 0) return true;
  const lastLink = existingLinks[existingLinks.length - 1]!;
  const expectedType = lastLink.type === 'strong' ? 'weak' : 'strong';
  return newLink.type === expectedType;
}

export function buildAICChains(
  graph: LinkGraph,
  maxLength: number = 9
): AICChain[] {
  const chains: AICChain[] = [];
  const allLinks = graph.getAllLinks();

  for (const startLink of allLinks) {
    if (startLink.type !== 'strong') continue;

    const startNode = startLink.from;
    dfsBuildChain(
      graph,
      startNode,
      [startLink],
      new Set([nodeKeyFromNode(startNode)]),
      maxLength,
      chains
    );
  }

  return chains;
}

function dfsBuildChain(
  graph: LinkGraph,
  currentNode: GraphNode,
  links: GraphLink[],
  visited: Set<string>,
  maxLength: number,
  chains: AICChain[]
): void {
  if (links.length > maxLength) return;

  const lastLink = links[links.length - 1]!;
  const lastTo = lastLink.to;

  for (const link of graph.getAdjacency(lastTo)) {
    if (link === lastLink) continue;

    const nextNode = link.from === lastTo ? link.to : link.from;

    if (visited.has(nodeKeyFromNode(nextNode)) && links.length > 2) {
      const isContinuous = checkContinuity(links, link);
      if (isContinuous) {
        chains.push({
          nodes: links.map((l) => l.from),
          links: [...links],
          isContinuous: true,
          isLoop: true,
        });
      }
      continue;
    }

    const newVisited = new Set(visited);
    newVisited.add(nodeKeyFromNode(nextNode));

    const newLinks: GraphLink[] = [...links, link];
    chains.push({
      nodes: newLinks.map((l) => l.from),
      links: newLinks,
      isContinuous: checkContinuity(links, link),
      isLoop: false,
    });

    if (newLinks.length < maxLength) {
      dfsBuildChain(graph, nextNode, newLinks, newVisited, maxLength, chains);
    }
  }
}

export function chainToLinks(chain: AICChain): Link[] {
  return chain.links.map((l) => ({
    from: l.from,
    to: l.to,
    type: l.type,
  }));
}
