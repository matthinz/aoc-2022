import { assertEquals } from "https://deno.land/std@0.167.0/testing/asserts.ts";
import {
  normalizeLineSegments,
  parseInput,
  partOne,
  partTwo,
} from "./day15.ts";

const INPUT = `
Sensor at x=2, y=18: closest beacon is at x=-2, y=15
Sensor at x=9, y=16: closest beacon is at x=10, y=16
Sensor at x=13, y=2: closest beacon is at x=15, y=3
Sensor at x=12, y=14: closest beacon is at x=10, y=16
Sensor at x=10, y=20: closest beacon is at x=10, y=16
Sensor at x=14, y=17: closest beacon is at x=10, y=16
Sensor at x=8, y=7: closest beacon is at x=2, y=10
Sensor at x=2, y=0: closest beacon is at x=2, y=10
Sensor at x=0, y=11: closest beacon is at x=2, y=10
Sensor at x=20, y=14: closest beacon is at x=25, y=17
Sensor at x=17, y=20: closest beacon is at x=21, y=22
Sensor at x=16, y=7: closest beacon is at x=15, y=3
Sensor at x=14, y=3: closest beacon is at x=15, y=3
Sensor at x=20, y=1: closest beacon is at x=15, y=3
`.trim().split("\n");

Deno.test("#partOne", () => {
  const result = partOne(INPUT, 10);
  assertEquals(result, 26);
});

Deno.test("#partTwo", () => {
  const result = partTwo(INPUT);
  assertEquals(result, "");
});

Deno.test("#parseInput", () => {
  const result = parseInput(INPUT);
  assertEquals(result, [
    { position: { x: 2, y: 18 }, closestBeacon: { x: -2, y: 15 } },
    { position: { x: 9, y: 16 }, closestBeacon: { x: 10, y: 16 } },
    { position: { x: 13, y: 2 }, closestBeacon: { x: 15, y: 3 } },
    { position: { x: 12, y: 14 }, closestBeacon: { x: 10, y: 16 } },
    { position: { x: 10, y: 20 }, closestBeacon: { x: 10, y: 16 } },
    { position: { x: 14, y: 17 }, closestBeacon: { x: 10, y: 16 } },
    { position: { x: 8, y: 7 }, closestBeacon: { x: 2, y: 10 } },
    { position: { x: 2, y: 0 }, closestBeacon: { x: 2, y: 10 } },
    { position: { x: 0, y: 11 }, closestBeacon: { x: 2, y: 10 } },
    { position: { x: 20, y: 14 }, closestBeacon: { x: 25, y: 17 } },
    { position: { x: 17, y: 20 }, closestBeacon: { x: 21, y: 22 } },
    { position: { x: 16, y: 7 }, closestBeacon: { x: 15, y: 3 } },
    { position: { x: 14, y: 3 }, closestBeacon: { x: 15, y: 3 } },
    { position: { x: 20, y: 1 }, closestBeacon: { x: 15, y: 3 } },
  ]);
});

Deno.test("#normalizeLineSegments", () => {
  const input: [number, number][] = [[12, 12], [2, 14], [2, 2], [-2, 2], [
    16,
    24,
  ], [14, 18]];
  const expected = [
    [-2, 24],
  ];
  assertEquals(
    normalizeLineSegments(input),
    expected,
  );
});
