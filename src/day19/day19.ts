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
  return "";
}

if (import.meta.main) {
  runDay(import.meta);
}
