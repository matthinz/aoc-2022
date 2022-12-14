import { runDay, sum } from "../utils.ts";

type Value = number | Value[];

async function run() {
  await runDay(partOne, partTwo);
}

export function partOne(input: string[]): number | string {
  const allPackets = input.map((line) => {
    if (line.trim() === "") {
      return;
    }
    return JSON.parse(line) as Value;
  }).filter(Boolean) as Value[][];

  const pairsInTheRightOrder: number[] = [];

  for (let i = 1; i <= allPackets.length / 2; i++) {
    const left = allPackets[(i - 1) * 2];
    const right = allPackets[((i - 1) * 2) + 1];
    if (!left || !right) {
      throw new Error("malformed input");
    }

    const inTheRightOrder = listsInTheRightOrder(left, right);
    if (inTheRightOrder === undefined) {
      throw new Error(`got undefined for pair ${i}`);
    }

    if (inTheRightOrder) {
      pairsInTheRightOrder.push(i);
    }
  }

  return pairsInTheRightOrder.reduce(sum, 0);
}

export function partTwo(input: string[]): number | string {
  return "";
}

function valuesInTheRightOrder(left: Value, right: Value): boolean | undefined {
  if (Array.isArray(left) && Array.isArray(right)) {
    return listsInTheRightOrder(left, right);
  }

  if (Array.isArray(left) && typeof right === "number") {
    return listsInTheRightOrder(left, [right]);
  }

  if (typeof left === "number" && Array.isArray(right)) {
    return listsInTheRightOrder([left], right);
  }

  if (typeof left !== "number") {
    throw new Error("left should be a number");
  }

  if (typeof right !== "number") {
    throw new Error("right should be a number");
  }

  if (left < right) {
    return true;
  }

  if (left > right) {
    return false;
  }

  // When values are equal, you gotta keep going
  return undefined;
}

function listsInTheRightOrder(
  left: Value[],
  right: Value[],
): boolean | undefined {
  for (let i = 0; i < Math.max(left.length, right.length); i++) {
    if (i >= left.length) {
      // left ran out of items first, things are in the right order
      return true;
    }

    if (i >= right.length) {
      // right ran out of items first, things are _not_ in the right order
      return false;
    }

    const ok = valuesInTheRightOrder(left[i], right[i]);

    if (ok !== undefined) {
      return ok;
    }
  }

  return undefined;
}

if (import.meta.main) {
  await run();
}
