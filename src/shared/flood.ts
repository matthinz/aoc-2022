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
  const toVisit: Node[] = [node];

  while (toVisit.length > 0) {
    const node = toVisit.shift();

    if (node == null) {
      continue;
    }

    const key = options.keyFor(node);

    if (visited.has(key)) {
      continue;
    }

    visited.set(key, node);

    const keepGoing = options.visit(node);

    if (keepGoing === false) {
      break;
    }

    toVisit.push(...options.neighborsOf(node));
  }

  return visited.values();
}
