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

    add(robots.geode * Math.pow(10, BONUS), "having geode robots");

    add(robots.obsidian * Math.pow(10, BONUS - 2), "having obsidian robots");

    add(robots.clay * Math.pow(10, BONUS - 4), "having clay robots");

    if (prev) {
      // add(
      //   robots.geode - prev.robots.geode * Math.pow(10, BONUS),
      //   "more geode robots than last frame",
      // );
      // add(
      //   robots.obsidian - prev.robots.obsidian * Math.pow(10, BONUS - 4),
      //   "more obsidian robots than last frame",
      // );
      // add(
      //   robots.clay - prev.robots.clay * Math.pow(10, BONUS - 5),
      //   "more clay robots than last frame",
      // );
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
