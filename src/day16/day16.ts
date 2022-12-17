import { runDay } from "../aoc.ts";

type Valve = {
  name: string;
  flowRate: number;
  pressureReleased: number;
  tunnelsTo: string[];
};

type Frame = {
  prev?: Frame;
  locations: Valve[];
  openValves: Valve[];
  pressureReleased: number;
};

export function partOne(input: string[]): number | string {
  const valves = parseInput(input);

  return solve(valves, 1, 30, singleActorHeadReducer.bind(undefined, valves));
}

export function partTwo(input: string[]): number | string {
  const valves = parseInput(input);
  return solve(valves, 2, 26, dualActorHeadReducer.bind(undefined, valves));
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

    return { name, flowRate, tunnelsTo, isOpen: false, pressureReleased: 0 };
  });
}

function calcPressureRelease(valves: Valve[]): number {
  return valves.reduce(
    function (sum, v) {
      return sum + v.flowRate;
    },
    0,
  );
}

function cull(nextHeads: Frame[], minute: number): Frame[] {
  if (nextHeads.length < 300000) {
    return nextHeads;
  }

  nextHeads.sort((a, b) => {
    return b.pressureReleased - a.pressureReleased;
  });

  return nextHeads.slice(0, nextHeads.length * 0.15);
}

function dualActorHeadReducer(
  valves: Valve[],
  nextHeads: Frame[],
  frame: Frame,
): Frame[] {
  const [myLocation, elephantLocation] = frame.locations;
  if (!myLocation || !elephantLocation) {
    throw new Error();
  }

  /*
    New heads we need to generate for this:

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
      nextHeads.push(...iStayAndOpenElephantMoves());
      // Generate a set of frame where elephant opens
      nextHeads.push(...iMoveElephantStaysAndOpens());
      if (myLocation !== elephantLocation) {
        // Generate a frame where we _both_ open
        nextHeads.push(weBothStayAndOpen());
      }
    }
  } else if (myLocationCanBeOpened) {
    // Generate a set of frames where I stay and elephant moves
    nextHeads.push(...iStayAndOpenElephantMoves());
  } else if (elephantLocationCanBeOpened) {
    // Generate a set of frames where I move and elephant stays
    nextHeads.push(...iMoveElephantStaysAndOpens());
  }

  // Finally, generate a set of frames where both of us move
  nextLocationsForMe.forEach((myNextLocation) => {
    nextLocationsForElephant.forEach((elephantsNextLocation) => {
      nextHeads.push({
        ...frame,
        prev: frame,
        locations: [myNextLocation, elephantsNextLocation],
        pressureReleased: frame.pressureReleased +
          calcPressureRelease(frame.openValves),
      });
    });
  });

  return nextHeads;

  function iMoveElephantStaysAndOpens(): Frame[] {
    return nextLocationsForMe.map((myNextLocation) => ({
      ...frame,
      prev: frame,
      locations: [myNextLocation, elephantLocation],
      openValves: [...frame.openValves, elephantLocation],
      pressureReleased: frame.pressureReleased +
        calcPressureRelease(frame.openValves),
    }));
  }

  function iStayAndOpenElephantMoves(): Frame[] {
    return nextLocationsForElephant.map((nextElephantLocation) => ({
      ...frame,
      prev: frame,
      locations: [myLocation, nextElephantLocation],
      openValves: [...frame.openValves, myLocation],
      pressureReleased: frame.pressureReleased +
        calcPressureRelease(frame.openValves),
    }));
  }

  function weBothStayAndOpen(): Frame {
    return {
      ...frame,
      prev: frame,
      locations: [myLocation, elephantLocation],
      openValves: [
        ...frame.openValves,
        myLocation,
        elephantLocation,
      ],
      pressureReleased: calcPressureRelease(frame.openValves),
    };
  }
}

function singleActorHeadReducer(
  valves: Valve[],
  nextHeads: Frame[],
  frame: Frame,
): Frame[] {
  const [location] = frame.locations;

  if (location.flowRate > 0) {
    const isOpen = frame.openValves.includes(location);
    if (!isOpen) {
      // Include a frame where we stay here and open the valve
      nextHeads.push({
        ...frame,
        prev: frame,
        openValves: [...frame.openValves, location],
        pressureReleased: frame.pressureReleased +
          calcPressureRelease(frame.openValves),
      });
    }
  }

  // Include a frame where we follow each tunnel
  nextHeads.push(
    ...location.tunnelsTo.map((name) => {
      const valve = valves.find((v) => v.name === name);
      if (!valve) {
        throw new Error(`Valve ${name} not found`);
      }
      return valve;
    }).map((to) => ({
      ...frame,
      prev: frame,
      locations: [to],
      pressureReleased: frame.pressureReleased +
        calcPressureRelease(frame.openValves),
    })),
  );

  return nextHeads;
}

function solve(
  valves: Valve[],
  actors: number,
  timeLimit: number,
  reducer: (heads: Frame[], frame: Frame) => Frame[],
): number {
  const AA = valves.find((v) => v.name === "AA");
  if (!AA) {
    throw new Error("Valve AA not found.");
  }

  let heads: Frame[] = [
    {
      locations: Array<Valve>(actors).fill(AA),
      openValves: [],
      pressureReleased: 0,
    },
  ];

  for (let minute = 1; minute <= timeLimit; minute++) {
    console.error(minute, heads.length);
    const nextHeads = heads.reduce(reducer, []);
    heads = cull(nextHeads, minute);
  }

  heads.sort((a, b) => b.pressureReleased - a.pressureReleased);

  return heads[0].pressureReleased;
}

if (import.meta.main) {
  runDay(import.meta);
}
