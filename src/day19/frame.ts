/*
  A frame is a 64 bit unsigned integer. The bits contained within are:

  Counts of resources & robots are stored using 5 bits each (0 - 31):

  Bits      Description
  0 - 4   : Geode resource count
  5 - 9   : Obsidian resource count
  10 - 14 : Clay resource count
  15 - 19 : Ore resource count

  A similar pattern is used for robot counts:
  20 - 24 : Geode robot count
  25 - 29 : Obsidian robot count
  30 - 34 : Clay robot count
  35 - 39 : Ore robot count

  This leaves 24 bits to store the address of the previous frame (up to
  16,777,216 frames total).
*/

import { RESOURCE_TYPES, ResourceType } from "./types.ts";

const FRAME_BIT_LENGTH = 64;
const RESOURCE_BIT_LENGTH = 5;
const ROBOT_BIT_LENGTH = 5;
const PARENT_FRAME_BIT_LENGTH = FRAME_BIT_LENGTH - (4 * RESOURCE_BIT_LENGTH) -
  (4 * ROBOT_BIT_LENGTH);

export const MAX_RESOURCE_VALUE = Math.pow(2, RESOURCE_BIT_LENGTH) - 1;
export const MAX_ROBOT_VALUE = Math.pow(2, ROBOT_BIT_LENGTH) - 1;
export const MAX_PARENT_VALUE = Math.pow(2, PARENT_FRAME_BIT_LENGTH) - 1;

export function createFrame(
  resources: number[] | { [key in ResourceType]?: number },
  robots: number[] | { [key in ResourceType]?: number },
  parent: number,
): bigint {
  let result = 0n;

  if (parent < 0 || parent > MAX_PARENT_VALUE) {
    throw new Error(`Invalid parent value: ${parent}`);
  }

  if (Array.isArray(resources) && resources.length !== RESOURCE_TYPES.length) {
    throw new Error(
      `resources array must have length ${RESOURCE_TYPES.length}`,
    );
  }

  resources = RESOURCE_TYPES.map((type, i) =>
    Array.isArray(resources) ? resources[i] : resources[type] ?? 0
  );

  if (Array.isArray(robots) && robots.length !== RESOURCE_TYPES.length) {
    throw new Error(`robots array must have length ${RESOURCE_TYPES.length}`);
  }

  robots = RESOURCE_TYPES.map((type, i) =>
    Array.isArray(robots) ? robots[i] : robots[type] ?? 0
  );

  for (let i = 0; i < resources.length; i++) {
    if (resources[i] < 0 || resources[i] > MAX_RESOURCE_VALUE) {
      throw new Error(`Invalid resource value: ${resources[i]}`);
    }

    const value = BigInt(resources[i]);
    const shift = BigInt(
      (FRAME_BIT_LENGTH) - ((i + 1) * RESOURCE_BIT_LENGTH),
    );
    const shiftedValue = value << shift;
    result = result | shiftedValue;
  }

  for (let i = 0; i < robots.length; i++) {
    if (robots[i] < 0 || robots[i] > MAX_ROBOT_VALUE) {
      throw new Error(`Invalid robot value: ${robots[i]}`);
    }

    const value = BigInt(robots[i]);
    const shift = BigInt(
      FRAME_BIT_LENGTH - (4 * RESOURCE_BIT_LENGTH) -
        ((i + 1) * ROBOT_BIT_LENGTH),
    );
    const shiftedValue = value << shift;
    result = result | shiftedValue;
  }

  result = result | BigInt(parent);

  return result;
}

export function getResource(frame: bigint, type: ResourceType): number {
  const typeIndex = RESOURCE_TYPES.indexOf(type);

  const shift = BigInt(
    (FRAME_BIT_LENGTH) - ((typeIndex + 1) * RESOURCE_BIT_LENGTH),
  );
  const mask = BigInt(MAX_RESOURCE_VALUE) << shift;

  const bits = frame & mask;

  return Number(bits >> shift);
}

export function getResourcesArray(frame: bigint): number[] {
  return RESOURCE_TYPES.map((resourceType) => {
    return getResource(frame, resourceType);
  });
}

export function getRobots(frame: bigint, type: ResourceType): number {
  const typeIndex = RESOURCE_TYPES.indexOf(type);

  const shift = BigInt(
    FRAME_BIT_LENGTH - (4 * RESOURCE_BIT_LENGTH) -
      ((typeIndex + 1) * ROBOT_BIT_LENGTH),
  );
  const mask = BigInt(MAX_RESOURCE_VALUE) << shift;

  const bits = frame & mask;

  return Number(bits >> shift);
}

export function getRobotsArray(frame: bigint): number[] {
  return RESOURCE_TYPES.map((resourceType) => {
    return getRobots(frame, resourceType);
  });
}

export function getParent(frame: bigint): number {
  return Number(frame & BigInt(MAX_PARENT_VALUE));
}

function binary(value: bigint): string {
  let result = "";
  let resultNoSpaces = "";
  for (let i = 63n; i >= 0n; i--) {
    const c = (value & (1n << i)) ? "1" : "0";
    result += c;
    resultNoSpaces += c;

    if (
      resultNoSpaces.length <=
        (RESOURCE_BIT_LENGTH * 4) + (ROBOT_BIT_LENGTH * 4) &&
      resultNoSpaces.length % 5 === 0
    ) {
      result += " ";
    }
  }
  return result;
}
