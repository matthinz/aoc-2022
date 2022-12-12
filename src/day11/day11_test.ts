import { assertEquals } from "https://deno.land/std@0.167.0/testing/asserts.ts";
import {
  calculateMonkeyBusinessLevel,
  inspectThroughAddition,
  inspectThroughMultiplication,
  inspectThroughSquaring,
  ItemWorryLevel,
  parseInput,
  part1WorryManagement,
  part2WorryManagement,
  runSimulation,
} from "./day11.ts";
import polynomial from "./math.ts";

const input = `
Monkey 0:
  Starting items: 79, 98
  Operation: new = old * 19
  Test: divisible by 23
    If true: throw to monkey 2
    If false: throw to monkey 3

Monkey 1:
  Starting items: 54, 65, 75, 74
  Operation: new = old + 6
  Test: divisible by 19
    If true: throw to monkey 2
    If false: throw to monkey 0

Monkey 2:
  Starting items: 79, 60, 97
  Operation: new = old * old
  Test: divisible by 13
    If true: throw to monkey 1
    If false: throw to monkey 3

Monkey 3:
  Starting items: 74
  Operation: new = old + 3
  Test: divisible by 17
    If true: throw to monkey 0
    If false: throw to monkey 1
    `.trim().split("\n");

Deno.test(
  "monkey parsing",
  () => {
    const monkeys = parseInput(input);
    assertEquals(4, monkeys.length);

    // Monkey 0
    assertEquals(monkeys[0].itemWorryLevels, [
      {
        23: polynomial(10, 3),
        19: polynomial(3, 4),
        13: polynomial(1, 6),
        17: polynomial(11, 4),
      },
      {
        23: polynomial(6, 4),
        19: polynomial(3, 5),
        13: polynomial(7, 7),
        17: polynomial(13, 5),
      },
    ]);
    assertEquals(monkeys[0].testDivisor, 23);
  },
);

Deno.test("part 1 simulation", () => {
  const monkeys = parseInput(input);

  runSimulation(
    monkeys,
    20,
    part1WorryManagement,
  );

  const monkeyBusiness = calculateMonkeyBusinessLevel(monkeys);
  assertEquals(monkeyBusiness, 10605);
});

Deno.test("part 2 simulation", () => {
  let monkeys = parseInput(input);
  runSimulation(monkeys, 1, part2WorryManagement);
  assertEquals([2, 4, 3, 6], monkeys.map((m) => m.itemsInspected));

  monkeys = parseInput(input);
  runSimulation(
    monkeys,
    20,
    part2WorryManagement,
  );
  assertEquals([99, 97, 8, 103], monkeys.map((m) => m.itemsInspected));

  monkeys = parseInput(input);
  runSimulation(
    monkeys,
    1000,
    part2WorryManagement,
  );
  assertEquals(
    [5204, 4792, 199, 5192],
    monkeys.map((m) => m.itemsInspected),
  );

  monkeys = parseInput(input);
  runSimulation(
    monkeys,
    10000,
    part2WorryManagement,
  );

  const monkeyBusiness = calculateMonkeyBusinessLevel(monkeys);
  assertEquals(monkeyBusiness, 2713310158);
});

Deno.test("#inspectThroughAddition", () => {
  const lhs: ItemWorryLevel = {
    2: polynomial(3, 2),
    3: polynomial(1, 2),
    7: polynomial(0, 1),
  };
  const actual = inspectThroughAddition(5, lhs);
  assertEquals(
    actual,
    {
      2: polynomial(0, 6),
      3: polynomial(0, 4),
      7: polynomial(5, 1),
    },
  );
});

Deno.test("#inspectThroughMultiplication", () => {
  const lhs: ItemWorryLevel = {
    2: polynomial(3, 2),
    3: polynomial(1, 2),
    7: polynomial(0, 1),
  };
  const actual = inspectThroughMultiplication(5, lhs);
  assertEquals(
    actual,
    {
      2: polynomial(1, 17),
      3: polynomial(2, 11),
      7: polynomial(0, 5),
    },
  );
});

Deno.test("#inspectThroughSquaring", () => {
  const lhs: ItemWorryLevel = {
    2: polynomial(3, 2), // 2x + 3
    3: polynomial(1, 2), // 2x + 1
    7: polynomial(0, 1), // x
  };
  const actual = inspectThroughSquaring(lhs);
  assertEquals(
    actual,
    {
      2: polynomial(1, 16, 4), // 4x^2 + 12x + 9 = 4x^2 + 16x + 1
      3: polynomial(1, 4, 4), // 4x^2 + 4x + 1
      7: polynomial(0, 0, 1), // x^2
    },
  );
});
