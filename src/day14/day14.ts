import { runDay } from "../aoc.ts";

const EMPTY = 0;
const STONE = 1;
const SAND_AT_REST = 2;

type Point = {
  readonly x: number;
  readonly y: number;
};

type Path = Point[];

type Grid = {
  width: number;
  height: number;
  origin: Point;
  readonly sandSource: Point;
  readonly infiniteX: boolean;
  cells: Uint8Array[];
};

type GameState = {
  sandPos?: Point;
  sandGrainsAtRest: number;
  isOver: boolean;
};

async function run() {
  await runDay(partOne, partTwo);
}

export function partOne(input: string[]): number | string {
  const grid = parseInput(input);

  const state: GameState = {
    sandGrainsAtRest: 0,
    isOver: false,
  };

  while (!state.isOver) {
    tick(grid, state);
  }

  return state.sandGrainsAtRest;
}

export function partTwo(input: string[]): number | string {
  const grid = parseInput(input, 2);

  const state: GameState = {
    sandGrainsAtRest: 0,
    isOver: false,
  };

  while (!state.isOver) {
    tick(grid, state);
  }

  return state.sandGrainsAtRest;
}

function tick(grid: Grid, state: GameState) {
  if (!state.sandPos) {
    // No sand is present, so add some!

    // if there is sand resting at our source, we're clogged
    const atSandSource = grid
      .cells[grid.sandSource.y - grid.origin.y][
        grid.sandSource.x - grid.origin.x
      ];
    if (atSandSource !== EMPTY) {
      state.isOver = true;
    } else {
      // Put a moving piece of sand at the sand source and end this tick
      state.sandPos = grid.sandSource;
    }

    return;
  }

  // We have a sand. Try to move it
  const nextPos = nextSandPos(state.sandPos, grid);
  if (!nextPos) {
    // this sand can't move any more and is now at rest
    grid
      .cells[state.sandPos.y - grid.origin.y][state.sandPos.x - grid.origin.x] =
        SAND_AT_REST;
    state.sandGrainsAtRest++;
    state.sandPos = undefined;
    return;
  }

  // if we've moved this sand off the grid, we done
  const x = nextPos.x - grid.origin.x;
  const y = nextPos.y - grid.origin.y;
  if (x < 0 || x >= grid.width || y < 0 || y >= grid.height) {
    state.sandPos = undefined;
    state.isOver = true;
    return;
  }

  // we can move this sand
  state.sandPos = nextPos;
}

/**
 * @returns Where a piece of sand located at <from> should move next on the grid.
 */
function nextSandPos(from: Point, grid: Grid): Point | undefined {
  // NOTE: coordinate system is oriented such that "down" _increases_ Y
  //       "to the left" decreases x, "to the right increases"

  const down = {
    x: from.x,
    y: from.y + 1,
  };

  const downAndToTheLeft = {
    x: from.x - 1,
    y: from.y + 1,
  };

  const downAndToTheRight = {
    x: from.x + 1,
    y: from.y + 1,
  };

  return [down, downAndToTheLeft, downAndToTheRight].find((p) => {
    if (p.y < 0 || p.y >= grid.height) {
      // we're completely off the grid, y-wise
      return false;
    }

    // X is more complicated:
    // For a grid with an infinite x axis, we need to expand it as it grows
    while (
      grid.infiniteX &&
      (p.x < grid.origin.x || p.x >= grid.origin.x + grid.width)
    ) {
      expandGrid(grid);
    }

    // translate into array coords
    const x = p.x - grid.origin.x;
    const y = p.y - grid.origin.y;

    if (x < 0 || x >= grid.width) {
      if (grid.infiniteX) {
        throw new Error("fell of the edge");
      }
      return true;
    }

    if (y < 0 || y >= grid.height) {
      return true;
    }

    const contents = grid.cells[y][x];

    return contents === EMPTY;
  });
}

function drawGrid(grid: Grid) {
  grid.cells.forEach((row, y) => {
    console.log(
      Array.from(row).map((c, x) => {
        if (
          x === (grid.sandSource.x - grid.origin.x) &&
          y === (grid.sandSource.y - grid.origin.y)
        ) {
          if (c === EMPTY) {
            return "+";
          }
        }

        switch (c) {
          case EMPTY:
            return " ";
          case STONE:
            return "#";
          case SAND_AT_REST:
            return "o";
          default:
            throw new Error(`Invalid cell data: ${c}`);
        }
      }).join(""),
    );
  });
}

function expandGrid(grid: Grid) {
  const oldWidth = grid.width;
  if (oldWidth % 2 === 1) {
    throw new Error("grid width must be even");
  }
  const newWidth = oldWidth * 2;
  const padding = (newWidth - oldWidth) / 2;

  const oldOrigin = grid.origin;
  const newOrigin = {
    x: oldOrigin.x - padding,
    y: oldOrigin.y,
  };

  const newCells = makeCells(newWidth, grid.height);

  // copy all existing cell data into newCells
  grid.cells.forEach((oldRow, oldY) => {
    oldRow.forEach((c, oldX) => {
      newCells[oldY][padding + oldX] = c;
    });
  });

  // extend the floor
  const floorY = grid.height - 1;
  const leftFloor = grid.cells[floorY][0];
  if (leftFloor !== STONE) {
    throw new Error(`expected stone at left, got ${leftFloor}`);
  }
  const rightFloor = grid.cells[floorY][oldWidth - 1];
  if (rightFloor !== STONE) {
    throw new Error(`expected stone at right, but got ${rightFloor}`);
  }

  for (let i = 0; i < padding; i++) {
    newCells[floorY][i] = leftFloor;
    newCells[floorY][padding + oldWidth + i] = rightFloor;
  }

  grid.width = newWidth;
  grid.origin = newOrigin;
  grid.cells = newCells;

  // drawGrid(grid);
}

function parseInput(input: string[], addFloor: false | number = false): Grid {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = 0;
  let maxY = -Infinity;

  const paths: Path[] = input.map((line) => {
    return line.split(" -> ").map((rawPoint) => {
      const [x, y] = rawPoint.split(",").map(Number);
      if (x < minX) {
        minX = x;
      }
      if (y < minY) {
        minY = y;
      }
      if (x > maxX) {
        maxX = x;
      }
      if (y > maxY) {
        maxY = y;
      }
      return { x, y };
    });
  });

  if (
    !isFinite(minX) || !isFinite(maxX) || !isFinite(minY) || !isFinite(maxY)
  ) {
    throw new Error();
  }

  let width = (maxX - minX) + 1;
  width = width % 2 === 1 ? width + 1 : width;

  if (addFloor) {
    // Extend in the y direction to add a floor
    maxY += addFloor;
    // and draw a floor
    paths.push(
      [{
        x: minX,
        y: maxY,
      }, {
        x: minX + width - 1,
        y: maxY,
      }],
    );
  }

  const height = (maxY - minY) + 1;
  const origin = {
    x: minX,
    y: minY,
  };

  const grid: Grid = {
    width,
    height,
    origin,
    sandSource: { x: 500, y: 0 },
    infiniteX: !!addFloor,
    cells: makeCells(width, height),
  };

  paths.forEach((path) => drawPath(path, grid));

  return grid;
}

function drawPath(path: Path, grid: Grid): void {
  path.forEach((current, index, ar) => {
    if (index === 0) {
      return;
    }

    const prev = ar[index - 1];

    const isHorizontal = prev.y === current.y;
    const isVertical = prev.x === current.x;

    if (isHorizontal) {
      const minX = Math.min(prev.x, current.x);
      const maxX = Math.max(prev.x, current.x);
      for (let x = minX; x <= maxX; x++) {
        grid.cells[current.y - grid.origin.y][x - grid.origin.x] = STONE;
      }
    } else if (isVertical) {
      const minY = Math.min(prev.y, current.y);
      const maxY = Math.max(prev.y, current.y);
      for (let y = minY; y <= maxY; y++) {
        grid.cells[y - grid.origin.y][current.x - grid.origin.x] = STONE;
      }
    } else {
      throw new Error("line is neither horizontal or vertical");
    }
  });
}

function makeCells(width: number, height: number): Uint8Array[] {
  return Array<Uint8Array>(height).fill(new Uint8Array()).map(() =>
    new Uint8Array(width)
  );
}

if (import.meta.main) {
  await run();
}
