import { readLines } from "https://deno.land/std@0.167.0/io/mod.ts";
import * as path from "https://deno.land/std@0.167.0/path/mod.ts";

type PuzzleResult<State> = number | string | {
  solution: number | string;
  state?: State;
};

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

  let reader: Deno.Reader = Deno.stdin;

  if (Deno.isatty(Deno.stdin.rid)) {
    // Nothing being piped in, try to load the input file for the main module
    const inputFile = path.join(
      path.dirname(path.fromFileUrl(Deno.mainModule)),
      "input",
    );
    reader = await Deno.open(inputFile, { read: true });
  }

  const allLines: string[] = [];

  for await (const line of readLines(reader)) {
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

export async function runDay<State>(
  part1: (
    input: string[],
  ) => PuzzleResult<State> | Promise<PuzzleResult<State>>,
  part2: (
    input: string[],
    state?: State,
  ) => number | string | Promise<number | string>,
  input?: string[],
) {
  input = input == null ? await getInputLines() : input;

  let result1 = await part1(input);

  if (typeof result1 === "string" || typeof result1 === "number") {
    result1 = {
      solution: result1,
    };
  }

  console.log(formatResult(1, result1.solution));

  const result2 = await part2(input, result1.state);
  console.log(formatResult(2, result2));
}

function formatResult(partIndex: number, result: number | string): string {
  if (typeof result === "number" || !result.includes("\n")) {
    return `Part ${partIndex}: ${result}`;
  }

  return `
Part ${partIndex}:
${result.split("\n").map((line) => `  ${line}`).join("\n")}
`.trim();
}
