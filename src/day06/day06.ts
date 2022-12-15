import { runDay } from "../aoc.ts";

export function partOne(input: string[]): number {
  const line = input[0] ?? "";

  for (let i = 3; i < line.length; i++) {
    if (line[i] === line[i - 3]) {
      continue;
    }
    if (line[i] === line[i - 2]) {
      i += 1;
      continue;
    }
    if (line[i] === line[i - 1]) {
      i += 2;
      continue;
    }
    if (line[i - 2] === line[i - 1]) {
      continue;
    }
    if (line[i - 3] === line[i - 2]) {
      continue;
    }
    if (line[i - 1] === line[i - 3]) {
      continue;
    }
    return i + 1;
  }

  throw new Error();
}

export function partTwo(input: string[]): number {
  const line = input[0] ?? "";
  for (let i = 13; i < line.length; i++) {
    const charCounts: { [key: string]: number } = {};
    let hasDupes = false;
    for (let j = 13; j >= 0; j--) {
      const c = line[i - j];
      charCounts[c] = charCounts[c] ?? 0;
      charCounts[c]++;

      if (charCounts[c] > 1) {
        hasDupes = true;
        break;
      }
    }

    if (hasDupes) {
      continue;
    }
    return i + 1;
  }
  throw new Error();
}

if (import.meta.main) {
  runDay(import.meta);
}
