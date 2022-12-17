import { runDay } from "../aoc.ts";
import { findCombinations, findSubsets } from "../shared/subsets.ts";

type Valve = {
  name: string;
  flowRate: number;
  isOpen: boolean;
  pressureReleased: number;
  tunnelsTo: string[];
};

type Action = {
  type: "move";
  destination: Valve;
} | {
  type: "open";
} | { type: "idle" };

type Plan = {
  actions: Action[];
  totalPressureRelease: number;
};

export function partOne(input: string[]): number | string {
  const valves = parseInput(input);

  /*
  each minute:
  update game state
  when no goal:
    - rank each valve by how much it would release in time remaining if we
      dropped everything and went to it
        - (this involves calculating a path)
    - pick the one with the highest score
  when have a goal:
    - if not on target, advance toward it
    - if on target, open valve
    - clear goal
  */

  const DURATION = 30;

  const START = valves.find((v) => v.name === "AA");
  if (!START) {
    throw new Error();
  }

  const paths = findPaths(valves, START, undefined, DURATION, []);

  console.log(
    paths.length,
  );
  paths.forEach((p) => console.log(p.length));

  let currentValve = valves[0];
  let actions: Action[] = [];

  for (let minute = 1; minute <= DURATION; minute++) {
    currentValve = tick(minute, valves, currentValve, actions);
  }

  return valves.reduce<number>(
    function (sum, v) {
      return sum + v.pressureReleased;
    },
    0,
  );
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

function tick(
  minute: number,
  valves: Valve[],
  currentValve: Valve,
  actions: Action[],
): Valve {
  console.error("== Minute %d ==", minute);

  // Update pressure release stats for each valve
  const openValves = valves.filter((v) => v.isOpen);
  if (openValves.length === 0) {
    console.error("No valves are open.");
  } else {
    let pressureReleased = 0;
    openValves.forEach((v) => {
      pressureReleased += v.flowRate;
      v.pressureReleased += v.flowRate;
    });

    console.error(
      "Valve%s %s %s open, releasing %d pressure.",
      openValves.length === 1 ? "" : "s",
      openValves.map(({ name }) => name).join(", "),
      openValves.length === 1 ? "is" : "are",
      pressureReleased,
    );
  }

  const action = actions.shift() ?? { type: "idle" };

  switch (action.type) {
    case "idle": {
      return currentValve;
    }
    case "open": {
      if (currentValve.isOpen) {
        throw new Error(`${currentValve.name} is already open`);
      }
      console.error("You open valve %s.", currentValve.name);
      currentValve.isOpen = true;
      return currentValve;
    }
    case "move": {
      console.error("You move to valve %s.", action.destination.name);
      return action.destination;
    }
  }
}

function findBestPlan(
  valves: Valve[],
  from: Valve,
  to: Valve | undefined,
  timeRemaining: number,
) {
  const paths = findPaths(valves, from, to, timeRemaining);

  /*
  For each path:
  Find the optimal subset of valves to open along the way

  For each path + optimal subset:
  Calculate the total pressure release

  Pick the path that releases the most pressure
  */

  paths.forEach((path: Valve[]) => {
    const steps = path.length - 1;
    const maxOpens = timeRemaining - steps;

    // find all combinations of valves of max length <maxOpens>
    const valvesToOpen = findSubsets(
      path.filter((valve) => !valve.isOpen && valve.flowRate > 0),
      Math.floor(maxOpens / 2),
      maxOpens,
    );

    // score those combinations
  });
}

/**
 * Finds all paths from <from> to <to> that can be traversed in <timeRemaining>
 * or less.
 */
function findPaths(
  valves: Valve[],
  from: Valve,
  to: Valve | undefined,
  timeRemaining: number,
  visited?: Valve[],
): Valve[][] {
  visited = visited ?? [from];

  if (!to) {
    return valves.reduce<Valve[][]>(
      function (result, valve) {
        if (valve === from) {
          return result;
        }
        result.push(...findPaths(valves, from, valve, timeRemaining, visited));
        return result;
      },
      [],
    );
  }

  if (from === to) {
    return [];
  }

  if (timeRemaining === 0) {
    return [];
  }

  if (from.tunnelsTo.includes(to.name)) {
    // Easy, 1 step, only 1 potential path
    return [[...visited, to]];
  }

  // Only step where we haven't previously stepped.
  const potentialSteps = from.tunnelsTo.map((name) => {
    const valve = valves.find((v) => v.name === name); // OPTIMIZE
    if (!valve) {
      throw new Error();
    }
    return valve;
  }).filter((valve) => !visited.includes(valve)); // OPTIMIZE

  return potentialSteps.reduce<Valve[][]>(
    function (result, step) {
      result.push(
        ...findPaths(valves, step, to, timeRemaining - 1, [...visited, step]),
      );
      return result;
    },
    [],
  );
}

if (import.meta.main) {
  runDay(import.meta);
}
