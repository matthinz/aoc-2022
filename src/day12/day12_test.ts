import { assertEquals } from "https://deno.land/std@0.167.0/testing/asserts.ts";
import { partOne } from "./day12.ts";

const INPUT = `
Sabqponm
abcryxxl
accszExk
acctuvwj
abdefghi
`.trim().split("\n");

Deno.test("test input", () => {
  const length = partOne(INPUT);
  assertEquals(length, 31);
});
