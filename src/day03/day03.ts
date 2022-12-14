import { runDay } from "../aoc.ts";

async function run() {
  await runDay(partOne, partTwo);
}

function partOne(input: string[]): number {
  return input.reduce(function (total, line) {
    const first = line.substring(0, line.length / 2);
    const second = line.substring(line.length / 2);

    // find item in first also present in second
    const item = first.split("").find((c) => {
      return second.indexOf(c) >= 0;
    });

    if (!item) {
      throw new Error();
    }

    return total + calcPriority(item);
  }, 0);
}

function partTwo(input: string[]): number {
  // go through input in batches of 3
  // find item type common to them
  // sum the priorities

  const BATCH_SIZE = 3;

  return input.reduce(function (total, line, index) {
    if (index % BATCH_SIZE !== 0) {
      return total;
    }

    const othersInGroup = input.slice(index + 1, index + BATCH_SIZE);
    const item = line.split("").find((c) => {
      return othersInGroup.every((o) => o.indexOf(c) >= 0);
    });

    if (!item) {
      throw new Error();
    }

    return total + calcPriority(item);
  }, 0);
}

function calcPriority(item: string): number {
  // lowercase priority = 1-26
  // uppercase = 27 - 52
  const c = item.charCodeAt(0);
  let priority: number;

  if (item.toUpperCase() === item) {
    // uppercase ascii A=65
    return c - 65 + 27;
  } else if (item.toLowerCase() === item) {
    return c - 97 + 1;
  } else {
    throw new Error();
  }
}

if (import.meta.main) {
  await run();
}
