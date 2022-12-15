import { runDay } from "../aoc.ts";

type Pos = {
  readonly x: number;
  readonly y: number;
};

type Direction = "L" | "R" | "U" | "D";

export function partOne(input: string[]): number | string {
  return countPlacesTouchedByTail(2, input);
}

export function partTwo(input: string[]): number | string {
  return countPlacesTouchedByTail(10, input);
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
      // printKnots(knots, `move: ${dir}`);
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

      const movedKnot = simulateMovement(
        prev,
        knot,
        `moving ${index}: ${JSON.stringify(knot)} constrained by ${
          JSON.stringify(prev)
        }`,
      );
      result.push(movedKnot);

      return result;
    },
    [],
  );
}

// given two positions, returns the new position for <b>
function simulateMovement(a: Pos, b: Pos, context?: string): Pos {
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
    // We're the same distance away, so move 1 unit in both directions
    result.x += xDistance > 0 ? 1 : -1;
    result.y += yDistance > 0 ? 1 : -1;
    // console.error("oh no", context, { xDistance, yDistance });
    //throw new Error("didn't handle this");
  }

  return result;
}

function printKnots(knots: Pos[], title: string) {
  const minX = knots.reduce((min, knot) => {
    return knot.x < min ? knot.x : min;
  }, Infinity);
  const maxX = knots.reduce((max, knot) => {
    return knot.x > max ? knot.x : max;
  }, -Infinity);
  const minY = knots.reduce((min, knot) => {
    return knot.y < min ? knot.y : min;
  }, Infinity);
  const maxY = knots.reduce((max, knot) => {
    return knot.y > max ? knot.y : max;
  }, -Infinity);

  const width = maxX - minX;
  const border = 4;

  console.log(title);

  for (let y = maxY + border; y >= minY - border; y--) {
    let row = Array(width + border * 2).fill(".").map((_, index) => {
      const knot = knots.findIndex((k) => k.y === y && k.x === minX + index);
      if (knot < 0) {
        return ".";
      } else if (knot === 0) {
        return "H";
      } else if (knot === knots.length - 1) {
        return "T";
      } else {
        return knot;
      }
    }).join("");

    row = [
      Array(border).fill(".").join(""),
      row,
      Array(border).fill(".").join(""),
      ` ${y}`,
    ].join("");

    console.log(row);
  }
  console.log(Array(width + (border * 2)).fill("-").join(""));
}

if (import.meta.main) {
  runDay(import.meta);
}
