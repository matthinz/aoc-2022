export type FloodOptions<Node> = {
  keyFor: (n: Node) => string;
  neighborsOf: (n: Node) => Node[];
  visit: (n: Node) => undefined | false;
};

export function flood<Node>(
  node: Node,
  options: FloodOptions<Node>,
): IterableIterator<Node> {
  const visited = new Map<string, Node>();

  floodNode(node, visited);

  return visited.values();

  function floodNode(node: Node, visited: Map<string, Node>): boolean {
    const key = options.keyFor(node);
    if (visited.has(key)) {
      return true;
    }

    const keepGoing = options.visit(node);
    if (keepGoing === false) {
      return false;
    }

    for (const neighbor of options.neighborsOf(node)) {
      if (!floodNode(neighbor, visited)) {
        return false;
      }
    }

    return true;
  }
}
