export type Pos = {
  x: number;
  y: number;
};

export type Path = Pos[];

type PosAsKey = string;

export type HeuristicFunction = (pos: Pos) => number;

export type EdgeWeightFunction = (current: Pos, neighbor: Pos) => number;

export type NeighborFinder = (pos: Pos) => Pos[];

export type AStarOptions = {
  start: Pos;
  goal: Pos;
  h: HeuristicFunction;
  findNeighbors: NeighborFinder;
  d: EdgeWeightFunction;
};

export function astar(
  {
    start,
    goal,
    h,
    findNeighbors,
    d,
  }: AStarOptions,
): Path | undefined {
  // this is pretty much just cribbed from the wikipedia page

  // Set of discovered nodes that may need to be re-expanded
  // Initially, only start node is known
  // Implemented here as a Map because we need control over the key
  const openSet = new Map<PosAsKey, Pos>();
  openSet.set(k(start), start);

  // For node n, cameFrom[n] is the node immediately preceding it on the
  // cheapest path from start to n currently known
  const cameFrom = new Map<PosAsKey, Pos>();

  // For node n, gScore[n] is the cost of the cheapest path from start to n currently known
  // (default value is Infinity)
  const gScore = new Map<PosAsKey, number>();
  gScore.set(k(start), 0);

  // For node n, fScore[n] = gScore[n] + h(n). fScore(n) represents the current
  // best guess as to how cheap a path _could_ be from start to finish if it
  // goes through n
  // (default value is Infinity)
  const fScore = new Map<PosAsKey, number>();
  fScore.set(k(start), h(start));

  while (openSet.size > 0) {
    const current = findNodeWithLowestFScore();
    if (pointsEqual(current, goal)) {
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

  function findNodeWithLowestFScore(): Pos {
    let best: Pos | undefined;
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

  function calculateFScore(n: Pos): number {
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
}

function k(pos: Pos): PosAsKey {
  return `${pos.x},${pos.y}`;
}

function pointsEqual(a: Pos, b: Pos): boolean {
  return a.x === b.x && a.y === b.y;
}

function reconstructPath(cameFrom: Map<string, Pos>, current: Pos): Path {
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
