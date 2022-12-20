import { runDay } from "../aoc.ts";
import { Board } from "./board.ts";
import { CircularBuffer } from "./circular_buffer.ts";
import { Rock, ROCKS } from "./rock.ts";

export function partOne(input: string[]): number | string {
  const jets = new CircularBuffer(input.join("").trim().split(""));
  const rocks = new CircularBuffer(ROCKS);
  const board = new Board(7, jets, rocks);

  const ROCKS_TO_DROP = 2022;

  return board.getHeightAfter(ROCKS_TO_DROP, false);
}

export function partTwo(input: string[]): number | string {
  const jets = new CircularBuffer(input.join("").trim().split(""));
  const rocks = new CircularBuffer(ROCKS);
  const board = new Board(7, jets, rocks);

  const ROCKS_TO_DROP = 1000000000000;

  return board.getHeightAfter(ROCKS_TO_DROP);
}

if (import.meta.main) {
  runDay(import.meta);
}
