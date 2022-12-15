import { runDay } from "../aoc.ts";
import { calculateExtremePoints, manhattanDistance, Point } from "../utils.ts";

type Sensor = {
  position: Point;
  closestBeacon: Point;
};

type Line = {
  readonly slope: number;
  readonly yIntercept: number;
};

export function partOne(
  input: string[],
  rowToConsider = 2000000,
): number | string {
  const sensors = parseInput(input);

  const segmentsOnLine = sensors.reduce<[number, number][]>(
    (segments, sensor) => {
      const { n, s, e, w } = getExtremesOfBeaconCoverage(sensor);

      // If rowToConsider is above the north point of the coverage or below
      // the south point of the coverage, ignore this sensor.
      if (northOf(rowToConsider, n) || southOf(rowToConsider, s)) {
        return segments;
      }

      // Find the intersections between:
      //  WS && SE
      //  - or -
      //  WN && NE
      // The distance between these intersections will be the # of positions
      // there can't be a beacon.

      [
        [findLine(w, s), findLine(s, e)],
        [findLine(w, n), findLine(n, e)],
      ].forEach(([left, right]) => {
        const x1 = solveForX(rowToConsider, left);
        const x2 = solveForX(rowToConsider, right);
        if (x1 >= w.x && x1 <= e.x && x2 >= w.x && x2 <= e.x) {
          // The line segment x1 <-> x2 at rowToConsider cannot contain
          // any beacons. Forward it to the next step.
          segments.push([Math.min(x1, x2), Math.max(x1, x2)]);
        }
      });

      return segments;
    },
    [],
  );

  const result = normalizeLineSegments(segmentsOnLine).reduce<number>(
    function (sum, [x1, x2]) {
      return sum + (Math.abs(x2 - x1));
    },
    0,
  );

  return result;
}

export function partTwo(input: string[]): number | string {
  return "";
}

export function normalizeLineSegments(
  segments: [number, number][],
): [number, number][] {
  return segments.reduce<[number, number][]>(
    function (result, segment) {
      // normalizedSegments will be a list where no line segments overlap

      // segment will have its lowest x value at position 0

      // if s1 does not intersect s2, use both
      // if s1 inside s2, ignore s1
      // if s2 inside s1, ignore s2
      // else use new segment with min + max points of s1, s2

      let segmentToAdd: [number, number] | undefined = segment;
      for (let i = 0; i < result.length; i++) {
        const n = result[i];

        if (inside(segmentToAdd, n)) {
          // segmentToAdd is inside n, which is already in the array.
          // We don't need to add it.
          segmentToAdd = undefined;
          break;
        }

        if (inside(n, segmentToAdd)) {
          // segmentToAdd contains n, which means we should remove n from the
          // array and then keep processing.
          result.splice(i, 1);
          i--;
          continue;
        }

        if (intersect(segmentToAdd, n) || intersect(n, segmentToAdd)) {
          // segmentToAdd and n intersect. we should remove n and start over
          // trying to add the union of the two segments
          result.splice(i, 1);
          segmentToAdd = union(segmentToAdd, n);
          i = -1;
          continue;
        }
      }

      if (segmentToAdd) {
        result.push(segmentToAdd);
      }

      return result;
    },
    [],
  );
  function intersect(a: [number, number], b: [number, number]): boolean {
    return (
      (a[0] >= b[0] && a[0] <= b[1]) ||
      (a[1] >= b[0] && a[1] <= b[1])
    );
  }
  function inside(a: [number, number], b: [number, number]): boolean {
    return a[0] >= b[0] && a[0] <= b[1] && a[1] >= b[0] && a[1] <= b[1];
  }
  function union(
    a: [number, number],
    b: [number, number],
  ): [number, number] {
    return [Math.min(a[0], b[0]), Math.max(a[1], b[1])];
  }
}

export function parseInput(input: string[]): Sensor[] {
  const rx =
    /Sensor at x=(-?\d+), y=(-?\d+): closest beacon is at x=(-?\d+), y=(-?\d+)/;
  return input.map((line, index) => {
    const m = rx.exec(line);
    if (!m) {
      throw new Error(`Line ${index + 1} is invalid`);
    }
    return {
      position: {
        x: parseInt(m[1], 10),
        y: parseInt(m[2], 10),
      },
      closestBeacon: {
        x: parseInt(m[3], 10),
        y: parseInt(m[4], 10),
      },
    };
  });
}

/**
 * @returns true if a is *above* b (and not touching)
 */
function northOf(a: Point | number, b: Point | number): boolean {
  const ay = (typeof a === "number" ? a : a.y);
  const by = (typeof b === "number" ? b : b.y);
  return ay < by;
}

/**
 * @returns true if a is **below** b (and not touching)
 */
function southOf(a: Point | number, b: Point | number): boolean {
  const ay = (typeof a === "number" ? a : a.y);
  const by = (typeof b === "number" ? b : b.y);
  return ay > by;
}

function findLine(a: Point, b: Point): Line {
  // slope = rise / run
  const slope = (b.y - a.y) / (b.x - a.x);
  const yIntercept = a.y - (slope * a.x);

  return { slope, yIntercept };
}

function solveForX(y: number, { slope, yIntercept }: Line): number {
  return (y - yIntercept) / slope;
}

/**
 * Finds the 4 points that mark the extremes of the beacon coverage for
 * the given sensor.
 */
function getExtremesOfBeaconCoverage(
  s: Sensor,
): { w: Point; n: Point; e: Point; s: Point } {
  const distance = manhattanDistance(s.position, s.closestBeacon);
  const { x, y } = s.position;
  return {
    w: { x: x - distance, y },
    n: { x, y: y - distance },
    e: { x: x + distance, y },
    s: { x, y: y + distance },
  };
}

if (import.meta.main) {
  runDay(import.meta);
}
