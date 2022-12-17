import { assertEquals } from "https://deno.land/std@0.167.0/testing/asserts.ts";
import { parseInput, partOne, partTwo } from "./day16.ts";

const INPUT = `
Valve AA has flow rate=0; tunnels lead to valves DD, II, BB
Valve BB has flow rate=13; tunnels lead to valves CC, AA
Valve CC has flow rate=2; tunnels lead to valves DD, BB
Valve DD has flow rate=20; tunnels lead to valves CC, AA, EE
Valve EE has flow rate=3; tunnels lead to valves FF, DD
Valve FF has flow rate=0; tunnels lead to valves EE, GG
Valve GG has flow rate=0; tunnels lead to valves FF, HH
Valve HH has flow rate=22; tunnel leads to valve GG
Valve II has flow rate=0; tunnels lead to valves AA, JJ
Valve JJ has flow rate=21; tunnel leads to valve II

`.trim().split("\n");

Deno.test("#partOne", () => {
  const result = partOne(INPUT);
  assertEquals(result, 1651);
});

Deno.test("#partTwo", () => {
  const result = partTwo(INPUT);
  assertEquals(result, "");
});

Deno.test("#parseInput", () => {
  const valves = parseInput(INPUT);
  assertEquals(valves.length, 10);
  assertEquals(valves.map((v) => v.name), [
    "AA",
    "BB",
    "CC",
    "DD",
    "EE",
    "FF",
    "GG",
    "HH",
    "II",
    "JJ",
  ]);
  assertEquals(valves.map((v) => v.flowRate), [
    0,
    13,
    2,
    20,
    3,
    0,
    0,
    22,
    0,
    21,
  ]);
  assertEquals(valves.map((v) => v.tunnelsTo.join(", ")), [
    "DD, II, BB",
    "CC, AA",
    "DD, BB",
    "CC, AA, EE",
    "FF, DD",
    "EE, GG",
    "FF, HH",
    "GG",
    "AA, JJ",
    "II",
  ]);
});
