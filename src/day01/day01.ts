import { runDay } from "../aoc.ts";

export function partOne(input: string[]): number {
  // Find the Elf carrying the most Calories. How many total Calories is that Elf carrying?
  return topCalorieCounts(input, 1);
}

export function partTwo(input: string[]): number {
  return topCalorieCounts(input, 3);
}

function topCalorieCounts(input: string[], count: number): number {
  const elfCalorieCounts: number[] = [];
  let index = 0;

  input.forEach((value) => {
    if (/^\s*$/.test(value)) {
      index++;

      return;
    }

    elfCalorieCounts[index] = (elfCalorieCounts[index] ?? 0) +
      parseInt(value, 10);
  });

  elfCalorieCounts.sort((x, y) => x - y);

  return elfCalorieCounts
    .slice(elfCalorieCounts.length - count)
    .reduce(function (acc, value) {
      return acc + value;
    }, 0);
}

if (import.meta.main) {
  runDay(import.meta);
}
