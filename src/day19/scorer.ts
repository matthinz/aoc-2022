import { findLargestOutputFrame } from "./simulation.ts";
import { Blueprint, Frame, Resource, RESOURCES, ResourceSet } from "./types.ts";

export type Scorer = (
  frame: Frame,
  totalTime: number,
  timeRemaining: number,
) => number;

export function createHeuristicScorer(
  blueprint: Blueprint,
): Scorer {
  return function heuristicScorer(
    { prev, resources, robots },
    totalTime: number,
    timeRemaining: number,
  ): number {
    /*
    Some notes:
    - Ore robots always only cost ore
    - Clay robots always only cost ore
    - Obsidian robots always cost ore + clay
    - Geode robots always cost obsidian + ore
    */

    const points: [number, string][] = [];
    const BONUS = 10;
    let shouldLog = Math.random() < 0.000000001;

    if (prev) {
      add(prev.score, "inherit previous score");
    }

    add(robots.geode * Math.pow(10, BONUS), "having geode robots");

    add(robots.obsidian * Math.pow(10, BONUS - 2), "having obsidian robots");

    add(robots.clay * Math.pow(10, BONUS - 4), "having clay robots");

    // reward robot diversity -- if this frame led to us getting a kind of
    // robot we didn't have before, give it a bonus
    if (prev) {
      for (let i = 0; i < RESOURCES.length - 1; i++) {
        const robotType = RESOURCES[i];
        const nextRobotType = RESOURCES[i + 1];
        const gotNewKindOfRobot = prev.robots[robotType] > 0 &&
          prev.robots[nextRobotType] === 0 && robots[nextRobotType] > 0;
        if (gotNewKindOfRobot) {
          add(
            (i + 1) * Math.pow(10, BONUS),
            `got ${nextRobotType} robots, which we didn't have before`,
          );
        }
      }
    }

    add(
      resources.clay + resources.geode + resources.obsidian + resources.ore,
      "tiebreaker: total resources",
    );

    const totalPoints = points.reduce(
      function (sum, [p]) {
        return sum + p;
      },
      0,
    );

    if (shouldLog) {
      console.error(
        "%d:\n%s",
        totalPoints,
        points.filter(([amount]) => amount !== 0).map(([amount, desc]) => {
          const symbol = amount >= 0 ? "+" : "";
          return `  ${symbol}${amount}: ${desc}`;
        }).join("\n"),
      );
    }

    return totalPoints;

    function add(amount: number, desc: string) {
      points.push([Math.floor(amount), desc]);
    }
  };
}

export function createPolynomialScorer(
  blueprint: Blueprint,
  outputType: Resource,
): Scorer {
  return function polynomialScorer({ resources, robots }) {
    return [
      resources.geode,
      0,
      0,
      0,
      0,
      robots.geode,
      0,
      0,
      robots.obsidian,
      0,
      0,
      resources.obsidian,
      0,
      0,
      robots.clay,
      0,
      0,
      resources.clay,
      0,
      0,
      robots.ore,
      0,
      0,
      resources.ore,
    ].reduce(
      function (result, coefficient, index, ar) {
        return result +
          (coefficient * Math.pow(10, ar.length - index));
      },
      0,
    );
  };
}
