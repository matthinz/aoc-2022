import { runDay } from "../aoc.ts";
import { astar, Path, Pos } from "./astar.ts";

type Map = {
  rows: number[][];
  start: Pos;
  dest: Pos;
  width: number;
  height: number;
};

export function partOne(input: string[]): number | string {
  const map = parseInput(input);

  const bestPath = findBestPath(map);

  if (!bestPath) {
    throw new Error("no best path");
  }

  // NOTE: "number of steps" = number of nodes - 1 (GAH!)
  return bestPath.length - 1;
}

export function partTwo(input: string[]): number | string {
  const map = parseInput(input);
  let bestPath: Path | undefined;

  const startingPositions = map.rows.reduce<Pos[]>(
    function (result, row, y) {
      row.forEach((height, x) => {
        if (height === 0) {
          result.push({ x, y });
        }
      });
      return result;
    },
    [],
  );

  startingPositions.forEach((pos) => {
    const bestPathFromHere = findBestPath(map, pos);
    if (!bestPathFromHere) {
      return;
    }

    if (bestPath == null || bestPathFromHere.length < bestPath.length) {
      bestPath = bestPathFromHere;
    }
  });

  if (!bestPath) {
    throw new Error("no best path");
  }

  return bestPath.length - 1;
}

function findBestPath(map: Map, start?: Pos): Path | undefined {
  let bestPath: Path | undefined;

  const heuristics = [
    manhattanDistance2D.bind(undefined, map),
    manhattanDistance3D.bind(undefined, map),
    xyDistanceHeuristic.bind(undefined, map),
    xyzDistanceHeuristic.bind(undefined, map),
  ];

  heuristics.forEach((h) => {
    const path = astar({
      start: start ?? map.start,
      goal: map.dest,
      d: calculateEdgeWeight.bind(undefined, map),
      findNeighbors: findNeighbors.bind(undefined, map),
      h,
    });

    if (!path) {
      return;
    }
    if (bestPath == null || path.length < bestPath.length) {
      bestPath = path;
    }
  });

  return bestPath;
}

function findNeighbors(map: Map, pos: Pos): Pos[] {
  // we can move up, down, left, and right
  return [
    { x: pos.x, y: pos.y - 1 },
    { x: pos.x, y: pos.y + 1 },
    { x: pos.x - 1, y: pos.y },
    { x: pos.x + 1, y: pos.y },
  ]
    // Remove things not on the map
    .filter((
      { x, y },
    ) => (x >= 0 && y >= 0 && x < map.width && y < map.height))
    // Remove things we can't step on
    .filter(({ x, y }) => {
      const currentHeight = map.rows[pos.y][pos.x];
      const destHeight = map.rows[y][x];
      return destHeight <= currentHeight + 1;
    });
}

function calculateEdgeWeight(
  map: Map,
  current: Pos,
  neighbor: Pos,
): number {
  const currentHeight = map.rows[current.y][current.x];
  const neighborHeight = map.rows[neighbor.y][neighbor.x];

  if (neighborHeight > currentHeight + 1) {
    return Infinity;
  }

  const destHeight = map.rows[map.dest.y][map.dest.x];

  // the lower you go, the higher the weight
  return (destHeight - neighborHeight);
}

function manhattanDistance2D(map: Map, pos: Pos): number {
  return (
    Math.abs(
      pos.x - map.dest.x,
    ) +
    Math.abs(pos.y - map.dest.y)
  );
}

function manhattanDistance3D(map: Map, pos: Pos): number {
  const currentHeight = map.rows[pos.y][pos.x];
  const destHeight = map.rows[map.dest.y][map.dest.x];

  return (
    Math.abs(pos.x - map.dest.x) +
    Math.abs(pos.y - map.dest.y) +
    currentHeight - destHeight
  );
}

function xyDistanceHeuristic(map: Map, pos: Pos): number {
  return Math.sqrt(
    Math.pow(map.dest.x - pos.x, 2) +
      Math.pow(map.dest.y - pos.y, 2),
  );
}

function xyzDistanceHeuristic(map: Map, pos: Pos): number {
  const height = map.rows[pos.y][pos.x];
  const destHeight = map.rows[map.dest.y][map.dest.x];
  return Math.sqrt(
    Math.pow(map.dest.x - pos.x, 2) +
      Math.pow(map.dest.y - pos.y, 2) +
      Math.pow(destHeight - height, 2),
  );
}

function parseInput(input: string[]): Map {
  const map: Map = {
    rows: [],
    start: { x: 0, y: 0 },
    dest: { x: 0, y: 0 },
    width: input[0].length,
    height: input.length,
  };

  input.forEach((line, y) => {
    if (line.length !== map.width) {
      throw new Error("invalid line length");
    }
    const row: number[] = [];
    map.rows.push(row);

    line.split("").forEach((cell, x) => {
      if (cell === "S") {
        map.start = { x, y };
        cell = "a";
      } else if (cell === "E") {
        map.dest = { x, y };
        cell = "z";
      }

      map.rows[y][x] = cell.charCodeAt(0) - ("a".charCodeAt(0));
    });
  });

  return map;
}

export function printMap(map: Map, path?: Path) {
  map.rows.forEach((row, y) => {
    console.log(
      row.map((height, x) => {
        const c = String.fromCharCode("a".charCodeAt(0) + height);

        if (!path) {
          return c;
        }

        const pathIndex = path?.findIndex((p) => p.x === x && p.y === y);
        if (pathIndex == null || pathIndex < 0) {
          return ".";
        }

        const next = path[pathIndex + 1];
        if (!next) {
          return "E";
        }

        if (next.x === x) {
          if (next.y === y + 1) {
            return "v";
          } else if (next.y === y - 1) {
            return "^";
          }
        } else if (next.y === y) {
          if (next.x === x - 1) {
            return "<";
          } else if (next.x === x + 1) {
            return ">";
          }
        }

        throw new Error();
      })
        .join(
          "",
        ),
    );
  });
}

if (import.meta.main) {
  runDay(import.meta);
}
