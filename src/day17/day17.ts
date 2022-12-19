import { runDay } from "../aoc.ts";
import { Board } from "./board.ts";
import { Rock, ROCKS } from "./rock.ts";

const EMPTY = 0;

const ROCK = 1;

export function partOne(input: string[]): number | string {
  const nextJet = createCircularReader(input.join("").trim().split(""));
  const nextRock = createCircularReader(ROCKS, 2022);

  const board = new Board(7, 20);

  let currentRock: Rock | undefined;

  let frame = 0;

  while (true) {
    if (currentRock == null) {
      // > Each rock appears so that its left edge is two units away from the
      // > left wall and its bottom edge is three units above the highest rock
      // > in the room (or the floor, if there isn't one).

      currentRock = nextRock();

      if (!currentRock) {
        break;
      }

      currentRock = currentRock.position(
        2,
        (_, height) => board.highestRockY + height + 3,
      );

      while (currentRock.y >= board.height) {
        board.grow();
      }

      continue;
    }

    switch (nextJet()) {
      case ">": {
        // Attempt to move rock to the right
        const movedRight = currentRock.position(currentRock.x + 1);
        if (board.canPlaceRock(movedRight)) {
          currentRock = movedRight;
        }
        break;
      }
      case "<": {
        // Move to the left
        const movedLeft = currentRock.position(currentRock.x - 1);
        if (board.canPlaceRock(movedLeft)) {
          currentRock = movedLeft;
        }
        break;
      }
      default: {
        throw new Error("Unrecognized jet direction");
      }
    }

    const movedDown = currentRock.position(undefined, currentRock.y - 1);
    if (board.canPlaceRock(movedDown)) {
      currentRock = movedDown;
    } else {
      // Rock can't move down any more.
      board.placeRock(currentRock);
      currentRock = undefined;
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

if (import.meta.main) {
  runDay(import.meta);
}
