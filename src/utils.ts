import { readLines } from "https://deno.land/std@0.167.0/io/mod.ts";

export async function getInputLines(
  input?: string,
): Promise<string[]> {
  if (typeof input === "string") {
    input = input.trim();

    if (input.length === 0) {
      return [];
    }

    return input.split("\n");
  }

  const allLines: string[] = [];

  for await (const line of readLines(Deno.stdin)) {
    allLines.push(line);
  }

  let startIndex = 0;
  while (
    startIndex < allLines.length && allLines[startIndex].trim().length === 0
  ) {
    startIndex++;
  }

  let endIndex = allLines.length - 1;
  while (endIndex >= startIndex && allLines[endIndex].trim().length === 0) {
    endIndex--;
  }

  return allLines.slice(startIndex, endIndex + 1);
}
