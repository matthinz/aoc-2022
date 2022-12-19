import { runDay } from "../aoc.ts";
import { Board } from "./board.ts";
import { Rock, ROCKS } from "./rock.ts";

export function partOne(input: string[]): number | string {
  const nextJet = createCircularReader(input.join("").trim().split(""));
  const nextRock = createCircularReader(ROCKS, 2022);

  const board = new Board(7, 20);

  while (true) {
    if (!tick(board, nextJet, nextRock)) {
      break;
    }
  }

  return board.highestRockY + 1;
}

export function partTwo(input: string[]): number | string {
  return "";
}

export function createCircularReader<T>(
  items: T[],
  maxReturns?: number,
): () => T | undefined {
  let index = -1;
  let count = 0;
  return () => {
    if (maxReturns != null && count === maxReturns) {
      return undefined;
    }
    index++;
    count++;
    if (index >= items.length) {
      index = 0;
    }
    return items[index];
  };
}

export function tick(
  board: Board,
  nextJet: () => string | undefined,
  nextRock: () => Rock | undefined,
): boolean {
  if (!board.hasMovingRocks()) {
    const rockToAdd = nextRock();
    if (!rockToAdd) {
      return false;
    }
    board.addMovingRock(rockToAdd);
    return true;
  }

  const jet = nextJet();
  if (!jet) {
    return false;
  }

  // Evaluate effect of jets on each moving rock
  board.mapRocks((rock) => {
    switch (jet) {
      case ">": {
        // Attempt to move rock to the right
        const movedRight = rock.position(rock.x + 1);
        return board.canPlaceRock(movedRight) ? movedRight : rock;
      }
      case "<": {
        // Move to the left
        const movedLeft = rock.position(rock.x - 1);
        return board.canPlaceRock(movedLeft) ? movedLeft : rock;
      }
      default: {
        throw new Error(`Unrecognized jet direction: '${jet}'`);
      }
    }
  });

  // Evaluate effect of gravity on rocks
  board.mapRocks((rock) => {
    const movedDown = rock.position(undefined, rock.y - 1);
    if (board.canPlaceRock(movedDown)) {
      return movedDown;
    }

    // Rock can't move down any more.
    board.placeRock(rock);
    return undefined;
  });

  return true;
}

if (import.meta.main) {
  runDay(import.meta);
}
