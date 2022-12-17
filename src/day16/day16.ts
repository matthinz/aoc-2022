import { runDay } from "../aoc.ts";

type Valve = {
  name: string;
  flowRate: number;
  pressureReleased: number;
  tunnelsTo: string[];
};

type Frame = {
  prev?: Frame;
  location: Valve;
  openValves: Valve[];
  pressureReleased: number;
};

export function partOne(input: string[]): number | string {
  const valves = parseInput(input);

  const AA = valves.find((v) => v.name === "AA");
  if (!AA) {
    throw new Error("Valve AA not found.");
  }

  let heads: Frame[] = [
    {
      location: AA,
      openValves: [],
      pressureReleased: 0,
    },
  ];

  const reducer = headReducer.bind(undefined, valves);

  for (let minute = 1; minute <= 30; minute++) {
    console.error("Minute %d: %d", minute, heads.length);

    const nextHeads = heads.reduce(reducer, []);
    heads = cull(nextHeads, minute);
  }

  heads.sort((a, b) => b.pressureReleased - a.pressureReleased);

  return heads[0].pressureReleased;
}

export function partTwo(input: string[]): number | string {
  return "";
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
  if (minute < 10) {
    return nextHeads;
  }

  if (nextHeads.length < 10000) {
    return nextHeads;
  }

  nextHeads.sort((a, b) => {
    return b.pressureReleased - a.pressureReleased;
  });

  return nextHeads.slice(0, nextHeads.length * 0.1);
}

function headReducer(
  valves: Valve[],
  nextHeads: Frame[],
  frame: Frame,
): Frame[] {
  if (frame.location.flowRate > 0) {
    const isOpen = frame.openValves.includes(frame.location);
    if (!isOpen) {
      // Include a frame where we stay here and open the valve
      nextHeads.push({
        ...frame,
        prev: frame,
        openValves: [...frame.openValves, frame.location],
        pressureReleased: frame.pressureReleased +
          calcPressureRelease(frame.openValves),
      });
    }
  }

  // Include a frame where we follow each tunnel
  nextHeads.push(
    ...frame.location.tunnelsTo.map((name) => {
      const valve = valves.find((v) => v.name === name);
      if (!valve) {
        throw new Error(`Valve ${name} not found`);
      }
      return valve;
    }).map((to) => ({
      ...frame,
      prev: frame,
      location: to,
      pressureReleased: frame.pressureReleased +
        calcPressureRelease(frame.openValves),
    })),
  );

  return nextHeads;
}

if (import.meta.main) {
  runDay(import.meta);
}
