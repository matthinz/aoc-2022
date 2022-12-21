import { assertEquals } from "https://deno.land/std@0.167.0/testing/asserts.ts";
import {
  Frame,
  nextFramesForTwoActors,
  parseInput,
  partOne,
  partTwo,
  Valve,
} from "./day16.ts";

const INPUT = `
Valve AA has flow rate=0; tunnels lead to valves DD, II, BB
Valve BB has flow rate=13; tunnels lead to valves CC, AA
Valve CC has flow rate=2; tunnels lead to valves DD, BB
Valve DD has flow rate=20; tunnels lead to valves CC, AA, EE
Valve EE has flow rate=3; tunnels lead to valves FF, DD
Valve FF has flow rate=0; tunnels lead to valves EE, GG
Valve GG has flow rate=0; tunnels lead to valves FF, HH
Valve HH has flow rate=22; tunnel leads to valve GG
Valve II has flow rate=0; tunnels lead to valves AA, JJ
Valve JJ has flow rate=21; tunnel leads to valve II

`.trim().split("\n");

Deno.test("#partOne", () => {
  const result = partOne(INPUT);
  assertEquals(result, 1651);
});

Deno.test("#partTwo", () => {
  const result = partTwo(INPUT);
  assertEquals(result, 1707);
});

Deno.test("#parseInput", () => {
  const valves = parseInput(INPUT);
  assertEquals(valves.length, 10);
  assertEquals(valves.map((v) => v.name), [
    "AA",
    "BB",
    "CC",
    "DD",
    "EE",
    "FF",
    "GG",
    "HH",
    "II",
    "JJ",
  ]);
  assertEquals(valves.map((v) => v.flowRate), [
    0,
    13,
    2,
    20,
    3,
    0,
    0,
    22,
    0,
    21,
  ]);
  assertEquals(valves.map((v) => v.tunnelsTo.join(", ")), [
    "DD, II, BB",
    "CC, AA",
    "DD, BB",
    "CC, AA, EE",
    "FF, DD",
    "EE, GG",
    "FF, HH",
    "GG",
    "AA, JJ",
    "II",
  ]);
});

Deno.test("#nextFramesForTwoActors", () => {
  const valves = parseInput(INPUT);
  const [AA, BB, DD, EE, FF, GG, HH, II, JJ] = [
    "AA",
    "BB",
    "DD",
    "EE",
    "FF",
    "GG",
    "HH",
    "II",
    "JJ",
  ].map((name) => valves.find((v) => v.name === name) as Valve);

  let frames: Frame[] = [{
    openValves: [],
    locations: [AA, AA],
    pressureReleased: 0,
    estimatedTotalPressureUltimatelyReleased: 0,
    totalPressureReleased: 0,
  }];

  for (let minute = 1; minute <= 10; minute++) {
    console.log("== Minute %d ==", minute);
    frames = frames.reduce<Frame[]>(
      function (nextFrames, frame) {
        nextFrames.push(...nextFramesForTwoActors(
          frame,
          valves,
          minute,
          26 - minute,
        ));
        return nextFrames;
      },
      [],
    );

    if (minute === 1) {
      // You move to valve II.
      // The elephant moves to valve DD.
      frames = frames.filter((f) =>
        f.locations[0] === II && f.locations[1] === DD
      );
      assertEquals(
        frames.length,
        1,
        `Should have 1 good frame, but have ${frames.length}`,
      );
      assertEquals(frames[0].pressureReleased, 0);
      assertEquals(frames[0].totalPressureReleased, 0);
    } else if (minute === 2) {
      // You move to valve JJ.
      // The elephant opens valve DD.
      frames = frames.filter((f) =>
        f.locations[0] === JJ && f.locations[1] === DD && f.openValves[0] === DD
      );
      assertEquals(
        frames.length,
        1,
        `Should have 1 good frame, but have ${frames.length}`,
      );
      assertEquals(frames[0].pressureReleased, 0);
      assertEquals(frames[0].totalPressureReleased, 0);
    } else if (minute === 3) {
      // You open valve JJ.
      // The elephant moves to valve EE.
      frames = frames.filter((f) =>
        f.locations[0] === JJ && f.locations[1] === EE && f.openValves[1] === JJ
      );
      assertEquals(
        frames.length,
        1,
        `Should have 1 good frame, but have ${frames.length}`,
      );
      assertEquals(frames[0].pressureReleased, 20);
      assertEquals(frames[0].totalPressureReleased, 20);
    } else if (minute === 4) {
      // You move to valve II.
      // The elephant moves to valve FF.
      frames = frames.filter((f) =>
        f.locations[0] === II && f.locations[1] === FF
      );
      assertEquals(
        frames.length,
        1,
        `Should have 1 good frame, but have ${frames.length}`,
      );
      assertEquals(frames[0].pressureReleased, 41);
      assertEquals(frames[0].totalPressureReleased, 61);
    } else if (minute === 5) {
      // You move to valve AA.
      // The elephant moves to valve GG.
      frames = frames.filter((f) =>
        f.locations[0] === AA && f.locations[1] === GG
      );
      assertEquals(
        frames.length,
        1,
        `Should have 1 good frame, but have ${frames.length}`,
      );
      assertEquals(frames[0].pressureReleased, 41);
      assertEquals(frames[0].totalPressureReleased, 102);
    } else if (minute === 6) {
      // You move to valve BB.
      // The elephant moves to valve HH.
      frames = frames.filter((f) =>
        f.locations[0] === BB && f.locations[1] === HH
      );
      assertEquals(
        frames.length,
        1,
        `Should have 1 good frame, but have ${frames.length}`,
      );
      assertEquals(frames[0].pressureReleased, 41);
      assertEquals(frames[0].totalPressureReleased, 143);
    } else if (minute === 7) {
      // You open valve BB.
      // The elephant opens valve HH.
      frames = frames.filter((f) =>
        f.locations[0] === BB && f.locations[1] === HH &&
        ((f.openValves[2] === BB && f.openValves[3] === HH) ||
          (f.openValves[2] === HH && f.openValves[3] === BB))
      );

      assertEquals(
        frames.length,
        1,
        `Should have 1 good frame, but have ${frames.length}`,
      );
      assertEquals(frames[0].pressureReleased, 41);
      assertEquals(frames[0].totalPressureReleased, 184);
    }
  }
});
