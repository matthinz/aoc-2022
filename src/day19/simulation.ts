import { heuristicScorer, Scorer } from "./scorer.ts";
import { Blueprint, Frame, Resource, RESOURCES, ResourceSet } from "./types.ts";

export function findLargestOutput(
  outputType: Resource,
  blueprint: Blueprint,
  minutes: number,
  scorer?: Scorer,
): number | undefined {
  const frame = findLargestOutputFrame(blueprint, outputType, minutes, scorer);
  return frame?.resources[outputType];
}

export function findLargestOutputFrame(
  blueprint: Blueprint,
  outputType: Resource,
  minutes: number,
  scorer?: Scorer,
): Frame | undefined {
  let frames: Frame[] = [{
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

  scorer = scorer ?? heuristicScorer;

  for (let minute = 1; minute <= minutes; minute++) {
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

  return frames[0];
}

export function tick(
  blueprint: Blueprint,
  frames: Frame[],
  _totalMinutes: number,
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

      const nextFrames = getNextFrames(
        blueprint,
        frame,
        scorer,
      );

      for (const nextFrame of nextFrames) {
        result.push(nextFrame);
      }

      return result;
    },
    [],
  );

  return cull(nextFrames, minute);
}

export function* getNextFrames(
  blueprint: Blueprint,
  prevFrame: Frame,
  scorer: Scorer,
): Generator<Frame> {
  // Do a frame where we build 1 of every robot we're able to...
  for (const resourceType of RESOURCES) {
    const [success, resourcesAfterBuy] = buyRobot(
      blueprint,
      resourceType,
      prevFrame.resources,
    );

    if (!success) {
      continue;
    }

    const frame = {
      prev: prevFrame,
      resources: collect(prevFrame.robots, resourcesAfterBuy),
      robots: {
        ...prevFrame.robots,
        [resourceType]: prevFrame.robots[resourceType] + 1,
      },
      score: 0,
    };

    frame.score = scorer(frame);

    yield frame;
  }

  // ...and a frame where we don't build anything
  const nullFrame: Frame = {
    prev: prevFrame,
    resources: collect(prevFrame.robots, prevFrame.resources),
    robots: prevFrame.robots,
    score: 0,
  };

  nullFrame.score = scorer(nullFrame);

  yield nullFrame;
}

function buyRobot(
  blueprint: Blueprint,
  robotType: Resource,
  resources: ResourceSet,
): [false] | [true, ResourceSet] {
  const resourcesAfterBuy = {
    ...resources,
  };

  for (const resourceType of RESOURCES) {
    const needed = blueprint.robotCosts[robotType][resourceType];
    if (needed == null) {
      continue;
    }
    if (resourcesAfterBuy[resourceType] < needed) {
      // Don't have enough to do this
      return [false];
    }
    resourcesAfterBuy[resourceType] -= needed;
  }

  return [true, resourcesAfterBuy];
}

function collect(robots: ResourceSet, resources: ResourceSet): ResourceSet {
  return {
    clay: resources.clay + robots.clay,
    geode: resources.geode + robots.geode,
    obsidian: resources.obsidian + robots.obsidian,
    ore: resources.ore + robots.ore,
  };
}

function cull(
  frames: Frame[],
  _minute: number,
): Frame[] {
  const KEEP = 10000;

  if (frames.length <= KEEP) {
    return frames;
  }

  frames.sort(compareFrames);

  return frames.slice(0, KEEP);

  function compareFrames(a: Frame, b: Frame): number {
    if (a.score > b.score) {
      return -1;
    } else if (b.score > a.score) {
      return 1;
    }

    if (a.prev && b.prev) {
      return compareFrames(a.prev, b.prev);
    } else {
      return 0;
    }
  }
}

function _summarize(blueprint: Blueprint, frame: Frame): string {
  const frames: Frame[] = [];
  for (let f: Frame | undefined = frame; f; f = f.prev) {
    frames.unshift(f);
  }

  return frames.map((frame, index) => {
    if (index === 0) {
      return;
    }

    return [
      `== Minute ${index} ==`,
      ...purchases(frame),
      ...collection(frame),
      ...ready(frame),
    ].join("\n");
  }).filter(Boolean).join("\n\n");

  function purchases(frame: Frame): string[] {
    return RESOURCES
      .filter((resourceType) => {
        return frame.robots[resourceType] >
          (frame.prev ? frame.prev.robots[resourceType] : 0);
      })
      .map(
        (resourceType) => {
          const purchased = frame.robots[resourceType] -
            (frame.prev ? frame.prev.robots[resourceType] : 0);

          const cost = RESOURCES
            .filter((r) => !!blueprint.robotCosts[resourceType][r])
            .map((r) =>
              `${(blueprint.robotCosts[resourceType][r] ?? 0) * purchased} ${r}`
            ).join(
              ", ",
            );

          return `Spend ${cost} to start building ${purchased} ${resourceType}-collecting robot${
            purchased === 1 ? "" : "s"
          }.`;
        },
      );
  }

  function collection({ prev, resources }: Frame): string[] {
    if (!prev) {
      return [];
    }

    return RESOURCES
      .filter((resourceType) => prev.robots[resourceType] > 0)
      .map((resourceType) => {
        const count = prev.robots[resourceType];
        const object = resourceType === "geode"
          ? `open ${resourceType}${count === 1 ? "" : "s"}`
          : resourceType;
        const gerund = resourceType === "geode" ? "cracking" : "collecting";
        const verb = resourceType === "geode" ? "crack" : "collect";
        return `${count} ${resourceType}-${gerund} robot${
          count === 1 ? "" : "s"
        } ${verb}${
          count === 1 ? "s" : ""
        } ${count} ${resourceType}; you now have ${
          resources[resourceType]
        } ${object}.`;
      });
  }

  function ready({ prev, robots }: Frame): string[] {
    return RESOURCES
      .filter((resourceType) => {
        const purchased = prev
          ? robots[resourceType] - prev.robots[resourceType]
          : 0;
        return purchased > 0;
      })
      .map((resourceType) => {
        const purchased = prev
          ? robots[resourceType] - prev.robots[resourceType]
          : 0;
        const verb = resourceType === "geode" ? "cracking" : "collecting";
        if (purchased === 1) {
          return `The new ${resourceType}-${verb} robot is ready; you now have ${
            robots[resourceType]
          } of them`;
        } else {
          return `The ${purchased} new ${resourceType}-${verb} robots are ready; you now have ${
            robots[resourceType]
          } of them`;
        }
      });
  }
}
