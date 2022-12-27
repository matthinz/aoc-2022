import { assertEquals } from "https://deno.land/std@0.167.0/testing/asserts.ts";
import { partOne, partTwo } from "./day19.ts";

export const INPUT = `
Blueprint 1:
  Each ore robot costs 4 ore.
  Each clay robot costs 2 ore.
  Each obsidian robot costs 3 ore and 14 clay.
  Each geode robot costs 2 ore and 7 obsidian.

Blueprint 2:
  Each ore robot costs 2 ore.
  Each clay robot costs 3 ore.
  Each obsidian robot costs 3 ore and 8 clay.
  Each geode robot costs 3 ore and 12 obsidian.
`.replace(/\n\s{2}/g, " ").trim().split("\n").filter((line) => line.length > 0);

Deno.test("#partOne", () => {
  const result = partOne(INPUT);
  assertEquals(result, 33);
});

Deno.test("#partTwo", () => {
  const result = partTwo(INPUT);
  assertEquals(result, "");
});
