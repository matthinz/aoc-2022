export const RESOURCE_TYPES = [
  "geode",
  "obsidian",
  "clay",
  "ore",
] as const;

export type ResourceType = typeof RESOURCE_TYPES[number];

export type RobotCosts = {
  [key in ResourceType]: { [key in ResourceType]?: number };
};

export type Blueprint = {
  id: number;
  robotCosts: RobotCosts;
};
