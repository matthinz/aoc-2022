import { Frame, Resource, RESOURCES } from "./types.ts";

export type Scorer = (
  frame: Frame,
) => number;

export function composeScorers(...scorers: Scorer[]): Scorer {
  return function composedScorer(
    frame: Frame,
  ): number {
    return scorers.reduce(
      function (total, scorer) {
        return total + scorer(frame);
      },
      0,
    );
  };
}

export function inheritPreviousScore(frame: Frame): number {
  return frame.prev?.score ?? 0;
}

export function createScorerThatRewardsRobotDiversity(bonus: number): Scorer {
  return function rewardRobotDiversityScorer(
    { prev, robots }: Frame,
  ): number {
    if (!prev) {
      return 0;
    }

    let result = 0;

    for (let i = 0; i < RESOURCES.length - 1; i++) {
      const robotType = RESOURCES[i];
      const gotNewKindOfRobot = prev.robots[robotType] == 0 &&
        robots[robotType] > 0;
      if (gotNewKindOfRobot) {
        result += bonus;
      }
    }

    return result;
  };
}

/**
 * Creates a scorer that scores based on the number of robots present
 * in a frame.
 */
export function createNumberOfRobotsScorer(
  base: number,
  order?: Resource[],
): Scorer {
  const finalOrder = order ?? ["geode", "obsidian", "clay", "ore"];
  return function numberOfRobotsScorer(
    frame: Frame,
  ): number {
    return finalOrder.reduce(
      function (score, resourceType, index, ar) {
        const power = ar.length - index;
        return score + (frame.robots[resourceType] * Math.pow(base, power));
      },
      0,
    );
  };
}

export const heuristicScorer = composeScorers(
  inheritPreviousScore,
  createNumberOfRobotsScorer(10),
  createScorerThatRewardsRobotDiversity(10000),
);
