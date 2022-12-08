import { readLines } from "https://deno.land/std@0.167.0/io/mod.ts";
import * as path from "https://deno.land/std@0.167.0/path/mod.ts";

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
