import { runDay } from "../utils.ts";

const EMPTY = 0;
const STONE = 1;
const SAND_AT_REST = 2;

type Point = {
  readonly x: number;
  readonly y: number;
};

type Path = Point[];

type Grid = {
  readonly width: number;
  readonly height: number;
  readonly origin: Point;
  readonly sandSource: Point;
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

  drawGrid(grid);

  while (!state.isOver) {
    tick(grid, state);
  }

  drawGrid(grid);

  return state.sandGrainsAtRest;
}

export function partTwo(input: string[]): number | string {
  return "";
}

function tick(grid: Grid, state: GameState) {
  if (!state.sandPos) {
    // No sand is present, so add some!
    state.sandPos = nextSandPos(grid.sandSource, grid);
    if (!state.sandPos) {
      console.error("we clogged");
      state.isOver = true;
    }

    // TODO: can we end up off the grid here

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
    // translate into array coords
    const x = p.x - grid.origin.x;
    const y = p.y - grid.origin.y;

    if (x < 0 || x >= grid.width || y < 0 || y >= grid.height) {
      // we've moved beyond the bounds of the grid, which means this
      // piece will just keep falling forever.
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
          return "+";
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

function parseInput(input: string[]): Grid {
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

  const width = (maxX - minX) + 1;
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
    cells: Array<Uint8Array>(height).fill(new Uint8Array()).map(() =>
      new Uint8Array(width)
    ),
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

if (import.meta.main) {
  await run();
}
