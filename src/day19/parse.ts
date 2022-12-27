import { Blueprint, Resource, RobotCosts } from "./types.ts";

export function parseInput(input: string[]): Blueprint[] {
  return input.map((line) => {
    const lines = line.split(/[\.:]\s*/);

    const idMatch = /Blueprint (\d+)/.exec(lines.shift() ?? "");
    if (!idMatch) {
      throw new Error(`Invalid input: ${line}`);
    }
    const id = parseInt(idMatch[1], 10);

    const robotCosts = lines.reduce<RobotCosts>(
      function (result, line) {
        const m = /Each (ore|clay|obsidian|geode) robot costs (.+)/.exec(line);
        if (!m) {
          return result;
        }
        const key = m[1] as Resource;

        m[2].split(" and ").map((item) => item.split(" ")).map(
          ([amount, item]) => {
            return [parseInt(amount, 10), item] as [number, Resource];
          },
        ).forEach(([amount, item]) => {
          result[key][item] = amount;
        });

        return result;
      },
      { ore: {}, clay: {}, obsidian: {}, geode: {} },
    );

    return { id, robotCosts };
  });
}
