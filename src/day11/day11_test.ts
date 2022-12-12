import { assertEquals } from "https://deno.land/std@0.167.0/testing/asserts.ts";
import { parseInput, runSimulation } from "./day11.ts";

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
    assertEquals([79, 98], monkeys[0].items);
    assertEquals(19, monkeys[0].op(1));
    assertEquals(true, monkeys[0].test(23));
    assertEquals(true, monkeys[0].test(46));
    assertEquals(false, monkeys[0].test(47));
    assertEquals(2, monkeys[0].trueReceiver);
    assertEquals(3, monkeys[0].falseReceiver);

    // Monkey 1 (new = old + 6)
    assertEquals(7, monkeys[1].op(1));

    // Monkey 2
    assertEquals(16, monkeys[2].op(4));

    // Monkey 3
    assertEquals(3, monkeys[3].op(0));
  },
);

Deno.test("simulation", () => {
  let monkeys = parseInput(input);
  runSimulation(monkeys, 1);

  assertEquals(monkeys[0].items, [20, 23, 27, 26]);
  assertEquals(monkeys[1].items, [2080, 25, 167, 207, 401, 1046]);
  assertEquals(monkeys[2].items, []);
  assertEquals(monkeys[3].items, []);

  runSimulation(monkeys, 1);
  assertEquals(monkeys[0].items, [695, 10, 71, 135, 350]);
  assertEquals(monkeys[1].items, [43, 49, 58, 55, 362]);
  assertEquals(monkeys[2].items, []);
  assertEquals(monkeys[3].items, []);
});
