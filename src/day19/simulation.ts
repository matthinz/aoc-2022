import { createHeuristicScorer, Scorer } from "./scorer.ts";
import {
  Blueprint,
  Cost,
  Frame,
  Resource,
  RESOURCES,
  ResourceSet,
} from "./types.ts";

let lastFrameId = 0;

export function findLargestOutput(
  outputType: Resource,
  blueprint: Blueprint,
  minutes: number,
  scorer?: Scorer,
): number | undefined {
  let frames: Frame[] = [{
    id: (lastFrameId++),
    robots: {
      clay: 0,
      geode: 0,
      obsidian: 0,
      ore: 1,
    },
    resources: {
      clay: 0,
      geode: 0,
      obsidian: 0,
      ore: 0,
    },
    score: 0,
  }];

  scorer = scorer ?? createHeuristicScorer(blueprint);

  const TARGET_ID = 9;

  for (let minute = 1; minute <= minutes; minute++) {
    const minScore = frames.reduce(
      function (score, frame) {
        return Math.min(score, frame.score);
      },
      Infinity,
    );
    const maxScore = frames.reduce(
      function (score, frame) {
        return Math.max(score, frame.score);
      },
      -Infinity,
    );
    const avgScore = frames.reduce(
      function (total, frame) {
        return total + frame.score;
      },
      0,
    ) / frames.length;

    const countWithMinScore = frames.filter((f) => f.score === minScore).length;
    const countWithMaxScore = frames.filter((f) => f.score === maxScore).length;
    const countAboveAvg = frames.filter((f) => f.score > avgScore).length;

    console.error(
      "Minute %d: %d (min: %d [%d frames], max: %d [%d frames], avg: %d [%d above avg])",
      minute,
      frames.length,
      minScore,
      countWithMinScore,
      maxScore,
      countWithMaxScore,
      avgScore,
      countAboveAvg,
    );
    frames = tick(blueprint, frames, minutes, minute, scorer);
  }

  frames.sort(
    (a, b) => {
      if (a.resources[outputType] > b.resources[outputType]) {
        return -1;
      } else if (b.resources[outputType] > a.resources[outputType]) {
        return 1;
      } else {
        return 0;
      }
    },
  );

  if (frames.length === 0) {
    return undefined;
  }

  console.error(summarize(blueprint, frames[0]));

  return frames[0].resources[outputType];
}

export function tick(
  blueprint: Blueprint,
  frames: Frame[],
  minutes: number,
  minute: number,
  scorer: Scorer,
): Frame[] {
  const nextFrames = frames.reduce<Frame[]>(
    function (result, frame) {
      /*
      Phases:
      1. Spending - Invest resources in new robots
      2. Collecting - Robots in the field deliver more resources to you
      3. Provisioning - Bring newly purchased robots online (ready to use next frame)
      */

      const nextMoves = new Map<
        string,
        Pick<Frame, "resources" | "robots">
      >();

      buildNextMoves(blueprint, frame, nextMoves, minutes - minute);

      for (const move of nextMoves.values()) {
        const robots = move.robots;
        const resources = collect(frame.robots, move.resources);

        const nextFrame = {
          id: (lastFrameId++),
          // prev: frame,
          robots,
          resources,
          score: 0,
        };

        nextFrame.score = scorer(nextFrame, minutes, minutes - minute);

        result.push(nextFrame);
      }

      return result;
    },
    [],
  );

  return cull(nextFrames, minute);
}

export function buildNextMoves(
  blueprint: Blueprint,
  { robots, resources }: Pick<Frame, "robots" | "resources">,
  moves: Map<string, Pick<Frame, "robots" | "resources">>,
  timeRemaining: number,
  soFar?: ResourceSet,
) {
  soFar = soFar ?? {
    clay: 0,
    geode: 0,
    obsidian: 0,
    ore: 0,
  };

  const key = k(soFar);

  if (moves.has(key)) {
    return;
  }

  moves.set(key, { robots, resources });

  for (const resourceType of RESOURCES) {
    const cost = blueprint.robotCosts[resourceType];
    const [success, resourcesAfterPurchase] = buyRobot(cost, resources);
    if (!success) {
      // We couldn't buy this robot.
      continue;
    }

    // We *could* buy this robot.
    // Do one variant where we bought it:
    buildNextMoves(
      blueprint,
      {
        robots: {
          ...robots,
          [resourceType]: robots[resourceType] + 1,
        },
        resources: resourcesAfterPurchase,
      },
      moves,
      timeRemaining,
      {
        ...soFar,
        [resourceType]: soFar[resourceType] + 1,
      },
    );

    // Do one variant where we did not
    buildNextMoves(
      blueprint,
      { robots, resources },
      moves,
      timeRemaining,
      soFar,
    );
  }
}

function buyRobot(
  cost: Cost,
  resources: ResourceSet,
): [false] | [true, ResourceSet] {
  let resourcesLeft: ResourceSet | undefined;

  for (const resource of RESOURCES) {
    const needed = cost[resource];
    if (needed == null) {
      continue;
    }

    if (resources[resource] < needed) {
      // Don't have enough of this
      return [false];
    }

    resourcesLeft = resourcesLeft ?? { ...resources };
    resourcesLeft[resource] -= needed;
  }

  return [true, resourcesLeft ?? resources];
}

function collect(robots: ResourceSet, resources: ResourceSet): ResourceSet {
  return {
    "clay": resources.clay + robots.clay,
    "geode": resources.geode + robots.geode,
    "obsidian": resources.obsidian + robots.obsidian,
    ore: resources.ore + robots.ore,
  };
}

function cull(
  frames: Frame[],
  minute: number,
): Frame[] {
  frames.sort(
    (a, b) => {
      if (a.score > b.score) {
        return -1;
      } else if (b.score > a.score) {
        return 1;
      } else {
        return 0;
      }
    },
  );

  return frames.slice(0, 2500);

  return result;
}

function k(resources: ResourceSet): string {
  return `c=${resources.clay},g=${resources.geode},ob=${resources.obsidian},or=${resources.ore}`;
}

function summarize(blueprint: Blueprint, frame: Frame): string {
  const frames: Frame[] = [];
  for (let f: Frame | undefined = frame; f; f = f.prev) {
    frames.unshift(f);
  }

  let prevRobots = frames[0].robots;

  return frames.map((f, index) => {
    if (index === 0) {
      return;
    }

    const purchased = RESOURCES.reduce<ResourceSet>(
      function (result, r) {
        result[r] = f.robots[r] - prevRobots[r];
        return result;
      },
      {
        clay: 0,
        geode: 0,
        obsidian: 0,
        ore: 0,
      },
    );

    const result = [
      `== Minute ${index} ==`,
      ...RESOURCES.filter((r) => purchased[r] > 0).map(
        (r) => {
          const cost = RESOURCES.filter((e) => !!blueprint.robotCosts[r][e])
            .map((e) => `${blueprint.robotCosts[r][e]} ${e}`).join(",");
          return `Spend ${cost} to start building a ${r}-collecting robot.`;
        },
      ),
      ...RESOURCES.filter((r) => prevRobots[r] > 0).map(
        (r) =>
          `${prevRobots[r]} ${r}-collecting robot collects ${
            prevRobots[r]
          } ${r}; you now have ${f.resources[r]} ${r}.`,
      ),
    ].join("\n");

    prevRobots = f.robots;

    return result;
  }).filter(Boolean).join("\n\n");
}
