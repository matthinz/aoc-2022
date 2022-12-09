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

  const newTail = simulateMovement(newHead, tail);

  return [newHead, newTail];
}

// given two positions, returns the new position for <b>
function simulateMovement(a: Pos, b: Pos): Pos {
  const xDistance = a.x - b.x;
  const yDistance = a.y - b.y;

  if (Math.abs(xDistance) <= 1 && Math.abs(yDistance) <= 1) {
    return b;
  }

  const result = { ...b };

  // When head and tail share an axis, it's a little easier
  if (xDistance === 0) {
    // Positive yDistance means head is above tail
    result.y += yDistance + (yDistance > 0 ? -1 : 1);
  } else if (yDistance === 0) {
    // Positive xDistance means head is to the right of tail
    result.x += xDistance + (xDistance > 0 ? -1 : 1);
  } else if (Math.abs(yDistance) > Math.abs(xDistance)) {
    // When head and tail don't share an axis, tail will snap
    // to the axis that it's closest away on
    // we're farthest away on the y axis, so tail will snap to same x coord
    result.x = a.x;
    result.y += yDistance + (yDistance > 0 ? -1 : 1);
  } else if (Math.abs(yDistance) < Math.abs(xDistance)) {
    // We're farthest away on x axis, so we snap to same y
    result.y = a.y;
    result.x += xDistance + (xDistance > 0 ? -1 : 1);
  } else {
    console.error({ xDistance, yDistance });
    throw new Error("didn't handle this");
  }

  return result;
}

if (import.meta.main) {
  await runDay(partOne, partTwo);
}
