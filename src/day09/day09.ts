import { runDay } from "../utils.ts";

type Pos = {
  readonly x: number;
  readonly y: number;
};

type Direction = "L" | "R" | "U" | "D";

export function partOne(input: string[]): number | string {
  let head: Pos = {
    x: 0,
    y: 0,
  };
  let tail: Pos = {
    x: 0,
    y: 0,
  };

  const touchedByTheTail: { [key: string]: boolean } = {};

  input.forEach((line) => {
    const parts = line.split(" ");
    const dir = parts[0] as Direction;
    const distance = parseInt(parts[1], 10);

    for (let i = 0; i < distance; i++) {
      [head, tail] = move(head, tail, dir);
      touchedByTheTail[
        `${tail.x},${tail.y}`
      ] = true;
      // console.error("%s: %o, %o", dir, head, tail);
    }
  });

  return Object.keys(touchedByTheTail).length;
}

export function partTwo(input: string[]): number | string {
  return "";
}

function move(head: Pos, tail: Pos, dir: Direction): [Pos, Pos] {
  const newHead = { ...head };
  const newTail = { ...tail };

  switch (dir) {
    case "U":
      newHead.y++;
      break;
    case "D":
      newHead.y--;
      break;
    case "L":
      newHead.x--;
      break;
    case "R":
      newHead.x++;
      break;
  }

  // Now we need to solve where the tail must be

  // If the tail is w/in 1 in both the x + y direction, it doesn't need to move
  const xDistance = newHead.x - newTail.x;
  const yDistance = newHead.y - newTail.y;

  if (Math.abs(xDistance) <= 1 && Math.abs(yDistance) <= 1) {
    return [newHead, newTail];
  }

  // When head and tail share an axis, it's a little easier
  if (xDistance === 0) {
    // Positive yDistance means head is above tail
    newTail.y += yDistance + (yDistance > 0 ? -1 : 1);
  } else if (yDistance === 0) {
    // Positive xDistance means head is to the right of tail
    newTail.x += xDistance + (xDistance > 0 ? -1 : 1);
  } else if (Math.abs(yDistance) > Math.abs(xDistance)) {
    // When head and tail don't share an axis, tail will snap
    // to the axis that it's closest away on
    // we're farthest away on the y axis, so tail will snap to same x coord
    newTail.x = newHead.x;
    newTail.y += yDistance + (yDistance > 0 ? -1 : 1);
  } else if (Math.abs(yDistance) < Math.abs(xDistance)) {
    // We're farthest away on x axis, so we snap to same y
    newTail.y = newHead.y;
    newTail.x += xDistance + (xDistance > 0 ? -1 : 1);
  } else {
    console.error({ xDistance, yDistance });
    throw new Error("didn't handle this");
  }

  return [newHead, newTail];

  // H

  // H
  // T

  // TH

  // HT

  // T
  // H

  // T
  //  H

  //  T
  // H

  //  H
  // T

  // H
  //  T

  return [head, tail];
}

if (import.meta.main) {
  await runDay(partOne, partTwo);
}
