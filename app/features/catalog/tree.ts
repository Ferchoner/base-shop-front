// Adaptado de base-ecomm-admin app/features/catalog/tree.ts (commit bbcd5af, ADR-F009): solo flattenTree.
import type { CategoryNode } from './types';

export interface FlatCategory {
  node: CategoryNode;
  depth: number;
}

/** Recorre el árbol en orden (padres antes que hijos) conservando la profundidad. */
export function flattenTree(
  nodes: readonly CategoryNode[],
  depth = 0,
): FlatCategory[] {
  return nodes.flatMap((node) => [
    { node, depth },
    ...flattenTree(node.children, depth + 1),
  ]);
}
