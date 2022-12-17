export type HeuristicFunction<Node> = (n: Node) => number;

export type EdgeWeightFunction<Node> = (
  current: Node,
  neighbor: Node,
) => number;

export type NeighborFinder<Node> = (n: Node) => Node[];

export type AStarOptions<Node, Key extends string> = {
  start: Node;
  goal: Node;
  h: HeuristicFunction<Node>;
  findNeighbors: NeighborFinder<Node>;
  nodesEqual?: (a: Node, b: Node) => boolean;
  d: EdgeWeightFunction<Node>;

  /**
   * Stringifies {n} for use a as a key in a Map or Set.
   * @param n
   * @returns
   */
  k: (n: Node) => Key;
};

export function astar<Node, Key extends string>(
  {
    start,
    goal,
    h,
    findNeighbors,
    nodesEqual,
    d,
    k,
  }: AStarOptions<Node, Key>,
): Node[] | undefined {
  // this is pretty much just cribbed from the wikipedia page

  nodesEqual = nodesEqual ?? ((a, b) => a === b);

  // Set of discovered nodes that may need to be re-expanded
  // Initially, only start node is known
  // Implemented here as a Map because we need control over the key
  const openSet = new Map<Key, Node>();
  openSet.set(k(start), start);

  // For node n, cameFrom[n] is the node immediately preceding it on the
  // cheapest path from start to n currently known
  const cameFrom = new Map<Key, Node>();

  // For node n, gScore[n] is the cost of the cheapest path from start to n currently known
  // (default value is Infinity)
  const gScore = new Map<Key, number>();
  gScore.set(k(start), 0);

  // For node n, fScore[n] = gScore[n] + h(n). fScore(n) represents the current
  // best guess as to how cheap a path _could_ be from start to finish if it
  // goes through n
  // (default value is Infinity)
  const fScore = new Map<Key, number>();
  fScore.set(k(start), h(start));

  while (openSet.size > 0) {
    const current = findNodeWithLowestFScore();
    if (nodesEqual(current, goal)) {
      return reconstructPath(cameFrom, current);
    }

    openSet.delete(k(current));

    for (const neighbor of findNeighbors(current)) {
      // d(current, neighbor) is the weight of the edge from current to neighbor
      // tentativeGScore is the distance from the start to the neighbor through current
      const tentativeGScore = (gScore.get(k(current)) ?? Infinity) +
        d(current, neighbor);
      if (tentativeGScore < (gScore.get(k(neighbor)) ?? Infinity)) {
        // this path is better than any previous one
        cameFrom.set(k(neighbor), current);
        gScore.set(k(neighbor), tentativeGScore);
        fScore.set(k(neighbor), tentativeGScore + h(neighbor));
        openSet.set(k(neighbor), neighbor);
      }
    }

    // open set is empty but goal was never reached
  }

  function findNodeWithLowestFScore(): Node {
    let best: Node | undefined;
    let bestScore = Infinity;

    for (const [_key, n] of openSet) {
      const f = calculateFScore(n);
      if (f <= bestScore) {
        best = n;
        bestScore = f;
      }
    }

    if (!best) {
      throw new Error();
    }
    return best;
  }

  function calculateFScore(n: Node): number {
    const key = k(n);
    const cached = fScore.get(key);
    if (cached != null) {
      return cached;
    }
    const result = gScore.get(key) ?? Infinity;
    if (!isFinite(result)) {
      return result;
    }

    return result + h(n);
  }

  function reconstructPath(
    cameFrom: Map<Key, Node>,
    current: Node,
  ): Node[] {
    const totalPath = [current];
    while (cameFrom.has(k(current))) {
      const next = cameFrom.get(k(current));
      if (!next) {
        throw new Error();
      }
      current = next;
      totalPath.unshift(current);
    }
    return totalPath;
  }
}
