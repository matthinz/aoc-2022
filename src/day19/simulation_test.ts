import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.167.0/testing/asserts.ts";
import { INPUT } from "./day19_test.ts";
import { parseInput } from "./parse.ts";
import { createHeuristicScorer } from "./scorer.ts";
import {
  findLargestOutput,
  findLargestOutputFrame,
  tick,
} from "./simulation.ts";
import { Frame, ResourceSet } from "./types.ts";

Deno.test("simulation - input 1", () => {
  const blueprints = parseInput(INPUT);
  const expected: Pick<Frame, "resources" | "robots">[] = [
    {
      robots: r({ ore: 1 }),
      resources: r({ ore: 1 }),
    },
    {
      robots: r({ ore: 1 }),
      resources: r({ ore: 2 }),
    },
    {
      robots: r({ ore: 1, clay: 1 }),
      resources: r({ ore: 1 }),
    },
    {
      robots: r({ ore: 1, clay: 1 }),
      resources: r({ ore: 2, clay: 1 }),
    },
    // Minute 5
    {
      robots: r({ ore: 1, clay: 2 }),
      resources: r({ ore: 1, clay: 2 }),
    },
    {
      robots: r({ ore: 1, clay: 2 }),
      resources: r({ ore: 2, clay: 4 }),
    },
    {
      robots: r({ ore: 1, clay: 3 }),
      resources: r({ ore: 1, clay: 6 }),
    },
    {
      robots: r({ ore: 1, clay: 3 }),
      resources: r({ ore: 2, clay: 9 }),
    },
    {
      robots: r({ ore: 1, clay: 3 }),
      resources: r({ ore: 3, clay: 12 }),
    },
    // Minute 10
    {
      robots: r({ ore: 1, clay: 3 }),
      resources: r({ ore: 4, clay: 15 }),
    },
    {
      robots: r({ ore: 1, clay: 3, obsidian: 1 }),
      resources: r({ ore: 2, clay: 4 }),
    },
    {
      robots: r({ ore: 1, clay: 4, obsidian: 1 }),
      resources: r({ ore: 1, clay: 7, obsidian: 1 }),
    },
    {
      robots: r({ ore: 1, clay: 4, obsidian: 1 }),
      resources: r({ ore: 2, clay: 11, obsidian: 2 }),
    },
    {
      robots: r({ ore: 1, clay: 4, obsidian: 1 }),
      resources: r({ ore: 3, clay: 15, obsidian: 3 }),
    },
    // Minute 15
    {
      robots: r({ ore: 1, clay: 4, obsidian: 2 }),
      resources: r({ ore: 1, clay: 5, obsidian: 4 }),
    },
    {
      robots: r({ ore: 1, clay: 4, obsidian: 2 }),
      resources: r({ ore: 2, clay: 9, obsidian: 6 }),
    },
    {
      robots: r({ ore: 1, clay: 4, obsidian: 2 }),
      resources: r({ ore: 3, clay: 13, obsidian: 8 }),
    },
    {
      robots: r({ ore: 1, clay: 4, obsidian: 2, geode: 1 }),
      resources: r({ ore: 2, clay: 17, obsidian: 3 }),
    },
    {
      robots: r({ ore: 1, clay: 4, obsidian: 2, geode: 1 }),
      resources: r({ ore: 3, clay: 21, obsidian: 5, geode: 1 }),
    },
    // Minute 20
    {
      robots: r({ ore: 1, clay: 4, obsidian: 2, geode: 1 }),
      resources: r({ ore: 4, clay: 25, obsidian: 7, geode: 2 }),
    },
    {
      robots: r({ ore: 1, clay: 4, obsidian: 2, geode: 2 }),
      resources: r({ ore: 3, clay: 29, obsidian: 2, geode: 3 }),
    },
    {
      robots: r({ ore: 1, clay: 4, obsidian: 2, geode: 2 }),
      resources: r({ ore: 4, clay: 33, obsidian: 4, geode: 5 }),
    },
    {
      robots: r({ ore: 1, clay: 4, obsidian: 2, geode: 2 }),
      resources: r({ ore: 5, clay: 37, obsidian: 6, geode: 7 }),
    },
    {
      robots: r({ ore: 1, clay: 4, obsidian: 2, geode: 2 }),
      resources: r({ ore: 6, clay: 41, obsidian: 8, geode: 9 }),
    },
  ];

  const frame = findLargestOutputFrame(
    blueprints[0],
    "geode",
    24,
    undefined,
    70,
    9,
  );
  if (!frame) {
    throw new Error("no output frame returned");
  }

  const frames: Frame[] = [];
  for (let f: Frame | undefined = frame; f; f = f.prev) {
    frames.unshift(f);
  }
  frames.shift(); // remove "minute 0" initialization frame

  for (let i = 0; i < Math.max(expected.length, frames.length); i++) {
    const expectedFrame = expected[i];
    const actualFrame = frames[i];
    if (expectedFrame && !actualFrame) {
      throw new Error(`ran out of actual frames at ${i}`);
    }
    if (actualFrame && !expectedFrame) {
      throw new Error(`ran out of expected frames at ${i}`);
    }

    const expectedStuff = {
      robots: expectedFrame.robots,
      resources: expectedFrame.resources,
    };
    const actualStuff = {
      robots: actualFrame.robots,
      resources: actualFrame.resources,
    };

    try {
      assertEquals(
        actualStuff,
        expectedStuff,
        `Minute ${i + 1} is inaccurate (frame id: ${actualFrame.id})`,
      );
    } catch (err) {
      console.error(expectedStuff);
      console.error(actualStuff);
      throw err;
    }
  }
});

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
