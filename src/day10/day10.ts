import { runDay } from "../aoc.ts";

async function run() {
  await runDay(partOne, partTwo);
}

export function partOne(input: string[]): number | string {
  const toRead = [20, 60, 100, 140, 180, 220];
  const signalStrengths: number[] = [];
  runProgram(input, (cycle, x) => {
    if (cycle === toRead[0]) {
      signalStrengths.push(cycle * x);
      toRead.shift();
    }
  });

  return signalStrengths.reduce(
    (sum, value) => sum + value,
    0,
  );
}

export function partTwo(input: string[]): number | string {
  const CRT_WIDTH = 40;
  const CRT_HEIGHT = 6;

  const emptyRow: string[] = Array(CRT_WIDTH).fill(".");
  const display: string[][] = Array<string[]>(CRT_HEIGHT).fill(emptyRow).map(
    (r) => [...r],
  );

  runProgram(input, (cycle, xRegister) => {
    // You count the pixels on the CRT: 40 wide and 6 high.
    // This CRT screen draws the top row of pixels left-to-right, then the row
    // below that, and so on. The left-most pixel in each row is in position 0,
    // and the right-most pixel in each row is in position 39.

    // Convert 1-based cycle index to 0-based x/y coords
    const pixelY = Math.floor((cycle - 1) / CRT_WIDTH);
    const pixelX = (cycle - 1) - (pixelY * CRT_WIDTH);

    // xRegister holds the horizontal position of the _middle_ of the sprite
    // If the sprite is positioned such that one of its three pixels is the
    // pixel currently being drawn, the screen produces a lit pixel (#);
    // otherwise, the screen leaves the pixel dark (.).

    const spriteLeft = xRegister - 1;
    const spriteRight = xRegister + 1;

    if (pixelX >= spriteLeft && pixelX <= spriteRight) {
      display[pixelY][pixelX] = "#";
    }
  });

  return display.map((row) => row.join("")).join("\n");
}

if (import.meta.main) {
  await run();
}

function runProgram(
  program: string[],
  callback: (cycle: number, x: number) => void,
) {
  let cycle = 0;
  let x = 1;

  program.forEach((line) => {
    const [instruction, rawValue] = line.split(" ");

    if (instruction === "noop") {
      // noop takes one cycle to complete. It has no other effect.
      tick(1);
      return;
    }

    if (instruction === "addx") {
      // addx V takes two cycles to complete.
      // After two cycles, the X register is increased by the value V. (V can be negative.)
      tick(2);
      x += parseInt(rawValue, 10);
    }
  });

  function tick(count: number) {
    for (let i = 0; i < count; i++) {
      cycle++;

      callback(cycle, x);
    }
  }
}
