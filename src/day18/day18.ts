import { runDay } from "../aoc.ts";
import { flood } from "../shared/flood.ts";

const DIMENSIONS = ["x", "y", "z"] as const;

type Position = {
  [key in typeof DIMENSIONS[number]]: number;
};

type Cube = Position & { surfaces: number };

type CubeIndex = {
  boundingCubeContains: (pos: Position) => boolean;
  getCube: (pos: Position) => Cube | undefined;
  readonly mins: Position;
  readonly maxes: Position;
};

export function partOne(input: string[]): number | string {
  const cubes = firstPass(input);
  return cubes.reduce<number>(
    function (sum, cube) {
      return sum + cube.surfaces;
    },
    0,
  );
}

export function partTwo(input: string[]): number | string {
  const cubes = firstPass(input);

  /*
  From each cube, try to flood fill.
  If the fill extends beyond the bounds of the larger thing, keep the surface,
  since it's exterior-facing.
  */

  const cubeIndex = indexCubes(cubes);

  cubes.forEach((cube) => {
    // Look at +1 and -1 in each direction
    // If that space is empty *and* a flood fill from that point does
    // not escape the bounding cube, then we should not count that face.

    for (const delta of [-1, 1]) {
      for (const dimension of DIMENSIONS) {
        const pos = { x: cube.x, y: cube.y, z: cube.z };
        pos[dimension] += delta;

        const cubeAtPosition = cubeIndex.getCube(pos);
        if (cubeAtPosition) {
          continue;
        }

        // No cube at this position -- flood fill from here
        let escaped = false;

        flood<Position>(pos, {
          keyFor: (pos) => `${pos.x},${pos.y},${pos.z}`,
          neighborsOf: (pos) => {
            const result: Position[] = [];
            for (const dimension of DIMENSIONS) {
              for (const delta of [-1, 1]) {
                const newPos: Position = { ...pos };
                newPos[dimension] += delta;
                if (!cubeIndex.getCube(newPos)) {
                  result.push(newPos);
                }
              }
            }
            return result;
          },
          visit: (pos) => {
            // if this position is outside the bounding cube,
            if (!cubeIndex.boundingCubeContains(pos)) {
              escaped = true;
              return false;
            }
          },
        });

        if (!escaped) {
          // Don't count this face
          cube.surfaces--;
          if (cube.surfaces < 0) {
            throw new Error("Cube can't have negative surfaces?");
          }
        }
      }
    }
  });

  return cubes.reduce<number>(
    function (sum, cube) {
      return sum + cube.surfaces;
    },
    0,
  );
}

function firstPass(input: string[]): Cube[] {
  const cubes: Cube[] = input.map((line) => {
    const [x, y, z] = line.split(",").map((x) => parseInt(x, 10));
    return { x, y, z, surfaces: 6 };
  });

  for (let i = 0; i < cubes.length; i++) {
    for (let j = i + 1; j < cubes.length; j++) {
      const a = cubes[i];
      const b = cubes[j];

      // Check for adjacency on 6 sides
      const areAdjacent =
        (a.x === b.x && a.y === b.y && Math.abs(a.z - b.z) === 1) ||
        (a.x === b.x && a.z === b.z && Math.abs(a.y - b.y) === 1) ||
        (a.y === b.y && a.z === b.z && Math.abs(a.x - b.x) === 1);

      if (areAdjacent) {
        a.surfaces--;
        b.surfaces--;
      }
    }
  }

  return cubes;
}

function indexCubes(cubes: Cube[]): CubeIndex {
  const byX = new Map<number, Map<number, Map<number, Cube>>>();
  const mins: Position = { x: Infinity, y: Infinity, z: Infinity };
  const maxes: Position = { x: -Infinity, y: -Infinity, z: -Infinity };

  cubes.forEach((cube) => {
    const { x, y, z } = cube;

    mins.x = Math.min(mins.x, x);
    mins.y = Math.min(mins.y, y);
    mins.z = Math.min(mins.z, z);

    maxes.x = Math.max(maxes.x, x);
    maxes.y = Math.max(maxes.y, y);
    maxes.z = Math.max(maxes.z, z);

    let byY = byX.get(x);
    if (!byY) {
      byY = new Map<number, Map<number, Cube>>();
      byX.set(x, byY);
    }
    let byZ = byY.get(y);
    if (!byZ) {
      byZ = new Map<number, Cube>();
      byY.set(y, byZ);
    }
    byZ.set(z, cube);
  });

  return { boundingCubeContains, getCube, mins, maxes };

  function boundingCubeContains(pos: Position): boolean {
    const { x, y, z } = pos;
    const result = (
      x >= mins.x && x <= maxes.x &&
      y >= mins.y && y <= maxes.y &&
      z >= mins.z && z <= maxes.z
    );
    return result;
  }

  function getCube(pos: Position): Cube | undefined {
    const { x, y, z } = pos;
    return byX.get(x)?.get(y)?.get(z);
  }
}

if (import.meta.main) {
  runDay(import.meta);
}
