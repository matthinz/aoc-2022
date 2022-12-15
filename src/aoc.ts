import { readLines } from "https://deno.land/std@0.167.0/io/mod.ts";
import * as path from "https://deno.land/std@0.167.0/path/mod.ts";
import { config } from "https://deno.land/std@0.167.0/dotenv/mod.ts";

const CACHE = ".cache";
const USER_AGENT = "matthinz";
const YEAR = 2022;

export type Solution = string | number | undefined;
export type Solver = (input: string[]) => Solution;

export function runDay(
  meta: ImportMeta,
): Promise<[Solution, Solution]> {
  return Promise.resolve().then(async () => {
    const mod = await import(meta.url);
    const err = console.error.bind(console);
    const day = dayFromPath(meta);

    const solvers = ["partOne", "partTwo"].map(
      (name) => {
        const solver = mod[name] as (Solver | undefined);
        if (typeof solver === "function") {
          return solver;
        }

        err("Day %d does not export a %s function.", day, name);
        return (): Solution => {
          console.error("Not implemented.");
          return undefined;
        };
      },
    );

    const input = (await getInputLinesFromStdIn()) ??
      (await getInputLinesFromAOC(YEAR, day));

    if (input == null) {
      throw new Error(`Could not find any input for day ${day}`);
    }

    return solvers.map((solver, index) => {
      const solution = solver(input);
      console.log(formatSolution(index + 1, solution));
      return solution;
    }) as [Solution, Solution];
  });
}

function dayFromPath(file: string | ImportMeta): number {
  const dir = path.basename(path.dirname(
    typeof file === "string" ? file : path.fromFileUrl(file.url),
  ));

  const m = /^day(\d+)/.exec(dir);

  if (!m) {
    throw new Error(`Expected directory name like 'day##', but got '${dir}'`);
  }

  const day = parseInt(m[1], 10);

  if (day < 1 || day > 24 || isNaN(day)) {
    throw new Error(`Invalid day: ${day}`);
  }

  return day;
}

function formatSolution(partIndex: number, solution: Solution): string {
  const isMultiline = typeof solution === "string" && solution.includes("\n");

  if (!isMultiline) {
    return `Part ${partIndex}: ${solution}`;
  }

  const lines = solution.split("\n")
    .map((line) => `  ${line}`);

  return `
Part ${partIndex}:
${lines.join("\n")}
`.trim();
}

/**
 * Requests the input for the given day.
 */
async function getInputLinesFromAOC(
  year: number,
  day: number,
): Promise<string[] | undefined> {
  const env = await config();
  const sessionToken = (env["SESSION"] ?? "").replace(
    /[^a-z0-9]/gi,
    "",
  );

  if (!sessionToken) {
    throw new Error(
      "SESSION environment variable does not contain a valid AOC token.",
    );
  }

  const cachePath = path.join(
    CACHE,
    sessionToken,
    `${year}-${day.toString().padStart(2, "0")}`,
  );

  let input: string | undefined;

  try {
    input = await Deno.readTextFile(cachePath);
  } catch (_err: unknown) {
    // Don't care
  }

  if (input == null) {
    const url = `https://adventofcode.com/${year}/day/${day}/input`;
    const options = {
      method: "GET",
      headers: {
        "user-agent": USER_AGENT,
        "cookie": `session=${sessionToken}`,
      },
    };

    const resp = await fetch(url, options);

    if (!resp.ok) {
      throw new Error(
        `Tried to fetch input, but got ${resp.status} ${resp.statusText}`,
      );
    }
    input = await resp.text();
  }

  try {
    await Deno.mkdir(path.dirname(cachePath), { recursive: true });
    await Deno.writeTextFile(cachePath, input);
  } catch (_err: unknown) {
    // Don't care
  }

  const trimmed = input.trim();
  return trimmed.length === 0 ? [] : trimmed.split("\n");
}

async function getInputLinesFromStdIn(): Promise<string[] | undefined> {
  if (Deno.isatty(Deno.stdin.rid)) {
    // Nothing is being piped in
    return;
  }

  const allLines: string[] = [];

  for await (const line of readLines(Deno.stdin)) {
    // Ignore leading blank lines
    if (allLines.length === 0 && line.trim().length === 0) {
      continue;
    }
    allLines.push(line);
  }

  let endIndex = allLines.length - 1;
  while (endIndex >= 0 && allLines[endIndex].trim().length === 0) {
    endIndex--;
  }

  return allLines.slice(0, endIndex + 1);
}
