import { runDay } from "../aoc.ts";
import * as reducers from "../shared/reducers.ts";
import { parseInput } from "./parse.ts";
import { findLargestOutput } from "./simulation.ts";

export function partOne(input: string[]): number | string {
  const blueprints = parseInput(input);

  const qualityLevels = blueprints.map((blueprint) => {
    const mostGeodes = findLargestOutput("geode", blueprint, 24);
    if (mostGeodes == null) {
      throw new Error(`Could not complete blueprint ${blueprint.id}`);
    }
    return mostGeodes * blueprint.id;
  });

  return qualityLevels.reduce(reducers.sum, 0);
}

export function partTwo(input: string[]): number | string {
  const blueprints = parseInput(input).slice(0, 3);
  if (blueprints.length !== 3) throw new Error();

  return blueprints.reduce(
    function (result, blueprint) {
      const geodes = findLargestOutput("geode", blueprint, 32);
      if (!geodes) {
        throw new Error("No result");
      }
      return result * geodes;
    },
    1,
  );
}

if (import.meta.main) {
  runDay(import.meta);
}
