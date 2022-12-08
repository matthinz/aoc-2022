import { runDay } from "../utils.ts";

async function run() {
  await runDay(partOne, partTwo);
}

type Move = {
  from: number;
  to: number;
  count: number;
};

type Input = {
  stacks: string[][];
  moves: Move[];
};

function partOne(input: string[]): string {
  const parsed = parseInput(input);

  // apply moves

  parsed.moves.forEach((m) => {
    for (let i = 0; i < m.count; i++) {
      const value = parsed.stacks[m.from - 1].pop();

      if (!value) {
        throw new Error();
      }
      parsed.stacks[m.to - 1].push(value);
    }
  });

  return parsed.stacks.map((s) => s[s.length - 1] ?? "").join("");
}

function partTwo(input: string[]): string {
  const parsed = parseInput(input);

  // apply moves

  parsed.moves.forEach((m) => {
    const source = parsed.stacks[m.from - 1];
    const dest = parsed.stacks[m.to - 1];

    const items = source.splice(source.length - m.count, m.count);

    items.forEach((i) => dest.push(i));
  });

  return parsed.stacks.map((s) => s[s.length - 1] ?? "").join("");
}

function parseInput(input: string[]): Input {
  const stacks: string[][] = [];
  const moves: Move[] = [];

  let inStacks = true;
  input.forEach((line) => {
    if (/^\s*$/.test(line)) {
      return;
    }

    if (/^(\s*\d+)+\s*$/.test(line)) {
      inStacks = false;
      return;
    }

    const m = /move (\d+) from (\d+) to (\d+)/.exec(line);

    if (m) {
      inStacks = false;
      moves.push({
        from: parseInt(m[2], 10),
        to: parseInt(m[3], 10),
        count: parseInt(m[1], 10),
      });
    }

    if (!inStacks) {
      return;
    }

    // put in empty slots to ease parsing
    line = line.replace(/ {4}(?= )/g, " [ ]");

    line = line.replace(/(^\[|\]$)/g, "");

    line.split("] [").forEach((value, index) => {
      if (value === " ") {
        return;
      }

      stacks[index] = stacks[index] ?? [];
      stacks[index].unshift(value);
    });
  });
  return { stacks, moves };
}

if (import.meta.main) {
  await run();
}
