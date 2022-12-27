import { Blueprint, RESOURCE_TYPES, ResourceType } from "./types.ts";
import {
  createFrame,
  getResource,
  getResourcesArray,
  getRobots,
  getRobotsArray,
  MAX_PARENT_VALUE,
  MAX_RESOURCE_VALUE,
  MAX_ROBOT_VALUE,
} from "./frame.ts";

type TickOptions = {
  blueprint: Blueprint;
  buffer: BigUint64Array;
  frameOffsets: number[];
  minute: number;
  totalMinutes: number;
};

export function findLargestOutput(
  blueprint: Blueprint,
  resourceType: ResourceType,
  totalMinutes: number,
): number {
  const buffer = new BigUint64Array(MAX_PARENT_VALUE);
  const frameOffsets: number[] = [0, 1];

  buffer[0] = createFrame({}, { ore: 1 }, 0);

  for (let minute = 1; minute <= totalMinutes; minute++) {
    const nextOffset = tick({
      blueprint,
      buffer,
      frameOffsets,
      minute,
      totalMinutes,
    });
    frameOffsets.push(nextOffset);
  }

  const lastFrameStart = frameOffsets[frameOffsets.length - 2];
  const lastFrameEnd = frameOffsets[frameOffsets.length - 1];
  const lastFrames = buffer.slice(lastFrameStart, lastFrameEnd);

  lastFrames.sort((a, b) => {
    const aValue = getResource(a, resourceType);
    const bValue = getResource(b, resourceType);
    if (aValue > bValue) {
      return -1;
    } else if (bValue > aValue) {
      return 1;
    } else {
      return 0;
    }
  });

  console.error("sort done");

  return getResource(buffer[0], resourceType);
}

export function tick(
  { blueprint, buffer, frameOffsets, minute }: TickOptions,
): number {
  let offset = frameOffsets[frameOffsets.length - 1];

  const prevFramesStart = frameOffsets[frameOffsets.length - 2] ?? 0;
  const prevFramesEnd = offset - 1;

  console.error("prev: %d - %d", prevFramesStart, prevFramesEnd);

  for (let i = prevFramesStart; i <= prevFramesEnd; i++) {
    const prevFrame = buffer[i];
    const seen = new Set<bigint>();
    for (const nextFrame of generateNextFrames(blueprint, prevFrame, i)) {
      // Don't track duplicate frames
      if (seen.has(nextFrame)) {
        continue;
      }

      buffer[offset] = nextFrame;
      offset++;
      seen.add(nextFrame);

      if (offset % 1000000 === 0) {
        console.error(offset);
      }
    }
  }

  console.error(minute, offset);

  return offset;
}

function* generateNextFrames(
  blueprint: Blueprint,
  parentFrame: bigint,
  parentFrameOffset: number,
  resources?: number[],
  robots?: number[],
  alreadyYieldedNullFrame?: boolean,
): Generator<bigint> {
  resources = resources ?? getResourcesArray(parentFrame);
  robots = robots ?? getRobotsArray(parentFrame);

  // Yield a frame where we did _nothing_
  if (!alreadyYieldedNullFrame) {
    const resourcesAfterCollection = collect(parentFrame, resources);
    if (resourcesAfterCollection) {
      yield createFrame(
        resourcesAfterCollection,
        robots,
        parentFrameOffset,
      );
    }
  }

  for (const i in RESOURCE_TYPES) {
    const resourceType = RESOURCE_TYPES[i];

    const buy = buyRobot(blueprint, resourceType, resources, robots);

    if (!buy) {
      continue;
    }

    const [resourcesAfterBuying, robotsAfterBuying] = buy;
    const resourcesAfterCollection = collect(parentFrame, resourcesAfterBuying);

    if (resourcesAfterCollection) {
      yield createFrame(
        resourcesAfterCollection,
        robotsAfterBuying,
        parentFrameOffset,
      );
    }

    for (
      const frame of generateNextFrames(
        blueprint,
        parentFrame,
        parentFrameOffset,
        resourcesAfterBuying,
        robotsAfterBuying,
        true,
      )
    ) {
      yield frame;
    }
  }
}

/**
 * Attempts to buy a robot of the given type.
 * Returns the resulting resources set with the cost of the robot deducted.
 */
function buyRobot(
  blueprint: Blueprint,
  resourceType: ResourceType,
  resources: number[],
  robots: number[],
): [number[], number[]] | undefined {
  const cost = blueprint.robotCosts[resourceType];
  const resourcesAfterBuying: number[] = [];
  const robotsAfterBuying: number[] = [];

  for (const i in RESOURCE_TYPES) {
    if (RESOURCE_TYPES[i] === resourceType) {
      if (robots[i] === MAX_ROBOT_VALUE) {
        return;
      }
      robotsAfterBuying.push(robots[i] + 1);
    } else {
      robotsAfterBuying.push(robots[i]);
    }

    const available = resources[i];
    const needed = cost[RESOURCE_TYPES[i]];
    if (needed == null) {
      resourcesAfterBuying.push(available);
      continue;
    }
    if (available >= needed) {
      resourcesAfterBuying.push(available - needed);
    } else {
      return;
    }
  }

  return [
    resourcesAfterBuying,
    robotsAfterBuying,
  ];
}

/**
 * Applies new resource collection and returns an updated resources array.
 */
function collect(
  parentFrame: bigint,
  resources: number[],
): number[] | undefined {
  const result: number[] = [];
  for (const i in RESOURCE_TYPES) {
    const robots = getRobots(parentFrame, RESOURCE_TYPES[i]);
    const value = (resources[i] ?? 0) + robots;
    if (value > MAX_RESOURCE_VALUE) {
      return;
    }
    result.push((resources[i] ?? 0) + robots);
  }
  return result;
}
