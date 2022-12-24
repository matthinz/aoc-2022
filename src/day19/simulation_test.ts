import { assertEquals } from "https://deno.land/std@0.167.0/testing/asserts.ts";
import { INPUT } from "./day19_test.ts";
import { parseInput } from "./parse.ts";
import { createHeuristicScorer } from "./scorer.ts";
import { findLargestOutput, tick } from "./simulation.ts";
import { Frame, ResourceSet } from "./types.ts";

Deno.test("#buildNextMoves - input 1", () => {
  const blueprint = parseInput(INPUT)[0];
  const scorer = createHeuristicScorer(blueprint);

  let minute = 1;

  let frames: Frame[] = [
    {
      id: 0,
      resources: r(),
      robots: r({ ore: 1 }),
      score: 0,
    },
  ];

  assertEquals(
    nextFrames(),
    [
      {
        resources: r({ ore: 1 }),
        robots: r({ ore: 1 }),
      },
    ],
  );

  assertEquals(
    nextFrames(),
    [
      {
        resources: r({ ore: 2 }),
        robots: r({ ore: 1 }),
      },
    ],
  );

  assertEquals(
    nextFrames(),
    [
      // Don't buy a clay robot (1)
      {
        resources: r({ ore: 3 }),
        robots: r({ ore: 1 }),
      },
      // Buy a clay robot (1)
      {
        resources: r({ ore: 1 }),
        robots: r({ ore: 1, clay: 1 }),
      },
    ],
  );

  assertEquals(
    nextFrames(),
    [
      // Never buy anything
      {
        resources: r({ ore: 4 }),
        robots: r({ ore: 1 }),
      },
      // Buy a clay robot this turn
      {
        resources: r({ ore: 2 }),
        robots: r({ ore: 1, clay: 1 }),
      },
      // Bought a clay robot last turn
      {
        resources: r({ ore: 2, clay: 1 }),
        robots: r({ ore: 1, clay: 1 }),
      },
    ],
  );

  function nextFrames(): Pick<Frame, "robots" | "resources">[] {
    frames = tick(blueprint, frames, 24, minute, scorer);
    minute++;
    return frames.map(({ robots, resources }) => ({ robots, resources }));
  }
});

Deno.test("max output - input 1", () => {
  const blueprint = parseInput(INPUT)[0];
  const scorer = createHeuristicScorer(blueprint);
  const maxGeodes = findLargestOutput("geode", blueprint, 24, scorer);
  assertEquals(maxGeodes, 9);
});

function r(values?: Partial<ResourceSet>): ResourceSet {
  return {
    clay: 0,
    geode: 0,
    obsidian: 0,
    ore: 0,
    ...values ?? {},
  };
}
