import { runDay } from "../aoc.ts";

export type Valve = {
  name: string;
  flowRate: number;
  tunnelsTo: string[];
};

export type Frame = {
  prev?: Frame;
  locations: Valve[];
  openValves: Valve[];
  pressureReleased: number; // Amount released _just this frame_
  totalPressureReleased: number; // Total amount released on this timeline
  estimatedTotalPressureUltimatelyReleased: number;
};

export function partOne(input: string[]): number | string {
  const valves = parseInput(input);
  return solve(valves, 1, 30, nextFramesForSingleActor);
}

export function partTwo(input: string[]): number | string {
  const valves = parseInput(input);
  return solve(valves, 2, 26, nextFramesForTwoActors);
}

export function parseInput(input: string[]): Valve[] {
  return input.map<Valve>((line) => {
    const m =
      /Valve (\w\w) has flow rate=(\d+); tunnels? leads? to valves? (.+)/.exec(
        line,
      );

    if (!m) {
      throw new Error(`Invalid input: ${line}`);
    }

    const name = m[1];
    const flowRate = parseInt(m[2], 10);
    const tunnelsTo = m[3].trim().split(", ");

    return { name, flowRate, tunnelsTo };
  });
}

export function calculatePressureReleaseStats(
  prevFrame: Frame,
  openValvesAtTheEndOfThisFrame: Valve[],
  timeRemaining: number,
): Pick<
  Frame,
  | "pressureReleased"
  | "totalPressureReleased"
  | "estimatedTotalPressureUltimatelyReleased"
> {
  const pressureReleased = prevFrame.openValves.reduce(
    function (sum, valve) {
      return sum + valve.flowRate;
    },
    0,
  );

  const totalPressureReleased = prevFrame.totalPressureReleased +
    pressureReleased;

  const pressureThatWillBeReleased =
    openValvesAtTheEndOfThisFrame === prevFrame.openValves
      ? pressureReleased
      : openValvesAtTheEndOfThisFrame.reduce(
        function (sum, valve) {
          return sum + valve.flowRate;
        },
        0,
      );

  const estimatedTotalPressureUltimatelyReleased = totalPressureReleased +
    (Math.max(0, timeRemaining - 1) * pressureThatWillBeReleased);

  return {
    pressureReleased,
    totalPressureReleased,
    estimatedTotalPressureUltimatelyReleased,
  };
}

function nextFramesForSingleActor(
  frame: Frame,
  valves: Valve[],
  minute: number,
  timeRemaining: number,
): Frame[] {
  if (frame.locations.length !== 1) {
    throw new Error();
  }

  if (frame.openValves.length === valves.length) {
    // all valves are open
    return [{
      ...frame,
      prev: frame,
      ...calculatePressureReleaseStats(
        frame,
        frame.openValves,
        timeRemaining,
      ),
    }];
  }

  const [location] = frame.locations;
  const result: Frame[] = [];

  if (location.flowRate > 0) {
    const isOpen = frame.openValves.includes(location);
    if (!isOpen) {
      // Include a frame where we stay here and open the valve
      result.push(stayAndOpen());
    }
  }

  // Include a frame where we follow each tunnel
  result.push(
    ...location.tunnelsTo.map((name) => {
      const valve = valves.find((v) => v.name === name);
      if (!valve) {
        throw new Error(`Valve ${name} not found`);
      }
      return valve;
    }).map(moveTo),
  );

  return result;

  function moveTo(location: Valve): Frame {
    return {
      ...frame,
      prev: frame,
      locations: [location],
      ...calculatePressureReleaseStats(
        frame,
        frame.openValves,
        timeRemaining,
      ),
    };
  }

  function stayAndOpen(): Frame {
    const nextOpenValves = [...frame.openValves, location];
    return {
      ...frame,
      prev: frame,
      openValves: nextOpenValves,
      ...calculatePressureReleaseStats(
        frame,
        nextOpenValves,
        timeRemaining,
      ),
    };
  }
}

export function nextFramesForTwoActors(
  frame: Frame,
  valves: Valve[],
  minute: number,
  minutesRemaining: number,
): Frame[] {
  if (frame.openValves.length === valves.length) {
    // all valves are open
    return [{
      ...frame,
      prev: frame,
      ...calculatePressureReleaseStats(
        frame,
        frame.openValves,
        minutesRemaining,
      ),
    }];
  }

  const [myLocation, elephantLocation] = frame.locations;
  if (!myLocation || !elephantLocation) {
    throw new Error();
  }

  const result: Frame[] = [];

  /*
    New frames we need to generate for this:

    1. I stay here and open, elephant moves
    2. Elephant stays here and opens, I move
    3. We both stay where we are and open (if in different locations)
    3. We both move (we can assume elephant and I will not move to same location)
  */

  const myLocationCanBeOpened = myLocation.flowRate > 0 &&
    !frame.openValves.includes(myLocation);

  const elephantLocationCanBeOpened = elephantLocation.flowRate > 0 &&
    !frame.openValves.includes(elephantLocation);

  const nextLocationsForMe = myLocation.tunnelsTo.map((name) =>
    valves.find((v) => v.name === name) as Valve
  );

  const nextLocationsForElephant = elephantLocation.tunnelsTo.map((name) =>
    valves.find((v) => v.name === name) as Valve
  );

  if (myLocationCanBeOpened && elephantLocationCanBeOpened) {
    if (myLocation === elephantLocation) {
      // Generate a set of frames where I open
      result.push(...iStayAndOpenElephantMoves());
      // Generate a set of frames where elephant opens
      result.push(...iMoveElephantStaysAndOpens());
    } else {
      // Generate a frame where we _both_ open
      result.push(weBothStayAndOpen());
    }
  } else if (myLocationCanBeOpened) {
    // Generate a set of frames where I stay and elephant moves
    result.push(...iStayAndOpenElephantMoves());
  } else if (elephantLocationCanBeOpened) {
    // Generate a set of frames where I move and elephant stays
    result.push(...iMoveElephantStaysAndOpens());
  }

  // Finally, generate a set of frames where both of us move
  const stats = calculatePressureReleaseStats(
    frame,
    frame.openValves,
    minutesRemaining,
  );
  nextLocationsForMe.forEach((myNextLocation) => {
    nextLocationsForElephant.forEach((elephantsNextLocation) => {
      // console.log(
      //   "I move %s, elephant moves %s",
      //   myNextLocation.name,
      //   elephantsNextLocation.name,
      // );
      result.push({
        ...frame,
        prev: frame,
        locations: [myNextLocation, elephantsNextLocation],
        ...stats,
      });
    });
  });

  return result;

  function iMoveElephantStaysAndOpens(): Frame[] {
    const nextOpenValves = [...frame.openValves, elephantLocation];
    return nextLocationsForMe.map((myNextLocation) => {
      // console.log(
      //   "I move to %s, elephant opens %s",
      //   myNextLocation.name,
      //   elephantLocation.name,
      // );
      return {
        ...frame,
        prev: frame,
        locations: [myNextLocation, elephantLocation],
        openValves: nextOpenValves,
        ...calculatePressureReleaseStats(
          frame,
          nextOpenValves,
          minutesRemaining,
        ),
      };
    });
  }

  function iStayAndOpenElephantMoves(): Frame[] {
    const nextOpenValves = [...frame.openValves, myLocation];
    return nextLocationsForElephant.map((nextElephantLocation) => {
      // console.log(
      //   "Elephant moves to %s, I stay and open %s",
      //   nextElephantLocation.name,
      //   myLocation.name,
      // );
      return {
        ...frame,
        prev: frame,
        locations: [myLocation, nextElephantLocation],
        openValves: nextOpenValves,
        ...calculatePressureReleaseStats(
          frame,
          nextOpenValves,
          minutesRemaining,
        ),
      };
    });
  }

  function weBothStayAndOpen(): Frame {
    const nextOpenValves = [...frame.openValves, myLocation, elephantLocation];

    return {
      ...frame,
      prev: frame,
      locations: [myLocation, elephantLocation],
      openValves: nextOpenValves,
      ...calculatePressureReleaseStats(
        frame,
        nextOpenValves,
        minutesRemaining,
      ),
    };
  }
}

function solve(
  valves: Valve[],
  actors: number,
  timeLimit: number,
  getNextFrames: (
    frame: Frame,
    valves: Valve[],
    minute: number,
    timeRemaining: number,
  ) => Frame[],
): number {
  const AA = valves.find((v) => v.name === "AA");
  if (!AA) {
    throw new Error("Valve AA not found.");
  }

  const startFrame: Frame = {
    locations: Array<Valve>(actors).fill(AA),
    openValves: [],
    pressureReleased: 0,
    totalPressureReleased: 0,
    estimatedTotalPressureUltimatelyReleased: 0,
  };

  let frames = new Map<string, Frame>();
  frames.set(k(startFrame), startFrame);

  for (let minute = 1; minute <= timeLimit; minute++) {
    console.error(minute, frames.size);

    const nextFrames = new Map<string, Frame>();

    frames.forEach((frame) => {
      getNextFrames(frame, valves, minute, timeLimit - minute).forEach(
        (child) => {
          nextFrames.set(k(child), child);
        },
      );
    });

    cull(nextFrames);
    frames = nextFrames;
  }

  const frameArray = Array.from(frames.values());
  frameArray.sort((a, b) => b.totalPressureReleased - a.totalPressureReleased);

  const best = frameArray[0];
  return best.totalPressureReleased;
}

function cull(frames: Map<string, Frame>) {
  const MAX_SIZE_BEFORE_CULLING = 1000; // Picked this number randomly

  if (frames.size < MAX_SIZE_BEFORE_CULLING) {
    return;
  }

  const ar = Array.from(frames.values());
  ar.sort((a, b) => {
    return b.totalPressureReleased - a.totalPressureReleased;
  });

  // remove the bottom n%
  const REMOVE = .5;
  const startRemoving = Math.floor(ar.length - (ar.length * REMOVE));
  for (let i = startRemoving; i < ar.length; i++) {
    frames.delete(k(ar[i]));
  }
}

function k(frame: Frame): string {
  const locations = frame.locations.map((l) => l.name);
  locations.sort();

  const openValves = frame.openValves.map((v) => v.name);
  openValves.sort();

  return [
    ...locations,
    ...openValves,
    frame.totalPressureReleased,
    frame.pressureReleased,
  ].join(",");
}

function summarizeFrame(frame: Frame) {
  const framesInOrder: Frame[] = [];
  for (let f: Frame | undefined = frame; f; f = f.prev) {
    framesInOrder.unshift(f);
  }

  framesInOrder.shift(); // Remove start frame (minute 0)

  framesInOrder.forEach((f, index) => {
    console.log("");
    console.log("== Minute %d == ", index + 1);

    const prevOpenValves = f.prev?.openValves ?? [];

    if (prevOpenValves.length === 0) {
      console.log("No valves are open.");
    } else if (prevOpenValves.length === 1) {
      console.log(
        "Valve %s is open, releasing %d pressure.",
        prevOpenValves[0].name,
        f.pressureReleased,
      );
    } else if (prevOpenValves.length === 2) {
      console.log(
        "Valves %s and %s are open, releasing %d pressure.",
        prevOpenValves[0].name,
        prevOpenValves[1].name,
        f.pressureReleased,
      );
    } else {
      const first = prevOpenValves.slice(0, prevOpenValves.length - 1);
      const last = prevOpenValves[prevOpenValves.length - 1];
      console.log(
        "Valves %s, and %s are open, releasing %d pressure.",
        first.map((v) => v.name).join(", "),
        last.name,
        f.pressureReleased,
      );
    }

    const actors = ["You", "The elephant"];
    const moveVerbs = ["move", "moves"];
    const openVerbs = ["open", "opens"];

    actors.forEach((actor, i) => {
      const prevLocation = f.prev?.locations[i];
      if (!prevLocation) {
        return;
      }
      if (f.locations[i] !== prevLocation) {
        console.log(
          "%s %s to valve %s.",
          actor,
          moveVerbs[i],
          f.locations[i].name,
        );
      } else {
        const wasOpened = !f.prev?.openValves.includes(prevLocation) &&
          f.openValves.includes(prevLocation);
        if (wasOpened) {
          console.log(
            "%s %s valve %s.",
            actor,
            openVerbs[i],
            prevLocation.name,
          );
        }
      }
    });
  });
}

if (import.meta.main) {
  runDay(import.meta);
}
