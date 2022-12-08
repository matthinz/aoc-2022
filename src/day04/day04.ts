import { runDay } from "../utils.ts";

async function run() {
  await runDay(partOne, partTwo);
}

type Range = {
  start: number;
  end: number;
};

function partOne(input: string[]): number {
  return input.reduce(function (total, line) {
    const ranges = parseLine(line);

    if (
      contains(...ranges) ||
      contains(...(ranges.reverse() as [Range, Range]))
    ) {
      return total + 1;
    }

    return total;
  }, 0);
}

function partTwo(input: string[]): number {
  return input.reduce(function (total, line) {
    const ranges = parseLine(line);

    if (overlap(...ranges)) {
      return total + 1;
    }

    return total;
  }, 0);
}

function parseLine(line: string): [Range, Range] {
  const result = line
    .split(",")
    .map((chunk) => {
      const parts = chunk.split("-");

      const start = parseInt(parts[0], 10);

      const end = parseInt(parts[1], 10);

      if (isNaN(start) || isNaN(end)) {
        return;
      }

      return {
        start,
        end,
      };
    })
    .filter(Boolean);

  if (result.length !== 2) {
    throw new Error();
  }

  return result as [Range, Range];
}

function contains(x: Range, y: Range): boolean {
  // return whether x completely contains y
  return y.start >= x.start && y.end <= x.end;
}

function overlap(x: Range, y: Range): boolean {
  // whether y overlaps with x

  return (
    (y.start >= x.start && y.start <= x.end) ||
    (y.end >= x.start && y.end <= x.end) ||
    (x.start >= y.start && x.start <= y.end) ||
    (x.end >= y.start && x.end <= y.end)
  );
}

if (import.meta.main) {
  await run();
}
