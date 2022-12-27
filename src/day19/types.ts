export const RESOURCES = ["ore", "clay", "obsidian", "geode"] as const;

export type Resource = typeof RESOURCES[number];

export type Cost = {
  [key in Resource]?: number;
};

export type RobotCosts = {
  [key in Resource]: Cost;
};

export type Blueprint = {
  id: number;
  robotCosts: RobotCosts;
};

export type ResourceSet = {
  [key in Resource]: number;
};

export type Frame = {
  prev?: Frame;
  id: number;
  robots: ResourceSet;
  resources: ResourceSet;
  score: number;
};
