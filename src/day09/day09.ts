import { runDay } from "../utils.ts";

type Pos = {
  readonly x: number;
  readonly y: number;
};

type Direction = "L" | "R" | "U" | "D";

export function partOne(input: string[]): number | string {
  return countPlacesTouchedByTail(2, input);
}

export function partTwo(input: string[]): number | string {
  return "";
}

function countPlacesTouchedByTail(knotCount: number, input: string[]): number {
  let knots: Pos[] = Array(knotCount).fill({ x: 0, y: 0 });

  const touchedByTheTail: { [key: string]: boolean } = {};

  input.forEach((line) => {
    const parts = line.split(" ");
    const dir = parts[0] as Direction;
    const distance = parseInt(parts[1], 10);

    for (let i = 0; i < distance; i++) {
      knots = move(knots, dir);
      const tail = knots[knots.length - 1];
      touchedByTheTail[
        `${tail.x},${tail.y}`
      ] = true;
    }
  });

  return Object.keys(touchedByTheTail).length;
}

function move(knots: Pos[], dir: Direction): Pos[] {
  return knots.reduce<Pos[]>(
    function (result, knot, index) {
      if (index === 0) {
        // actually move one unit in the given direction
        const newHead = { ...knot };
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
        result.push(newHead);
        return result;
      }

      // for _all other knots_, we need to move them constrained by the
      // one ahead of them
      const prev = result[result.length - 1];
      if (!prev) throw new Error();

      const movedKnot = simulateMovement(prev, knot);
      result.push(movedKnot);

      return result;
    },
    [],
  );
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
