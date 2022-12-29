import { runDay } from "../aoc.ts";

export function partOne(input: string[]): number | string {
  const numbers = input.map((line) => parseInt(line, 10));
  mix(numbers);

  const zeroPos = numbers.indexOf(0);
  if (zeroPos < 0) {
    throw new Error("No 0 in the list");
  }

  return [1000, 2000, 3000].reduce(
    function (result, offset) {
      return result + numbers[(zeroPos + offset) % numbers.length];
    },
    0,
  );
}

export function partTwo(input: string[]): number | string {
  return "";
}

function mix(numbers: number[], log?: (...args: any[]) => void) {
  const l = log ?? (() => {});

  // transforms is an array of functions used to translate a position from
  // the old array to the new one.
  const transforms: ((pos: number) => number)[] = [];

  l("Initial arrangement:");
  l(numbers.join(", "));

  [...numbers].forEach((num, pos, ar) => {
    const oldPos = transforms.reduce((result, tx) => tx(result), pos);
    let newPos: number;

    const delta = num % ar.length;

    if (delta > 0) {
      if (oldPos + delta === ar.length - 1) {
        // When moving forward, if we hit the last position, we're actually
        // moving to the beginning of the list
        newPos = 0;
      } else if (oldPos + delta >= ar.length) {
        newPos = (oldPos + delta + 1) % ar.length;
      } else {
        newPos = oldPos + delta;
      }
    } else if (delta < 0) {
      if (oldPos + delta === 0) {
        // When moving backwards, if we hit position 0, we're actually
        // at the _end_ of the list
        newPos = ar.length - 1;
      } else if (oldPos + delta < 0) {
        newPos = ar.length + (oldPos + delta - 1);
      } else {
        newPos = oldPos + delta;
      }
    } else {
      newPos = oldPos;
    }

    if (newPos > oldPos) {
      numbers.splice(newPos + 1, 0, num);
      numbers.splice(oldPos, 1);
    } else if (newPos < oldPos) {
      numbers.splice(newPos, 0, num);
      numbers.splice(oldPos + 1, 1);
    }
    transforms.push((p) => {
      if (p === oldPos) {
        return newPos;
      } else if (p > oldPos && p <= newPos) {
        return p - 1;
      } else {
        return p;
      }
    });

    if (newPos === oldPos) {
      l("\n%d does not move:", num);
    } else {
      l(
        "\n%d moves between %d and %d:",
        num,
        newPos === 0 ? numbers[numbers.length - 1] : numbers[newPos - 1],
        newPos === numbers.length - 1 ? numbers[0] : numbers[newPos + 1],
      );
    }
    l(numbers.join(", "));
  });
}

if (import.meta.main) {
  runDay(import.meta);
}
