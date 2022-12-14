import { runDay } from "../aoc.ts";
import polynomial, { Polynomial } from "./math.ts";

export type ItemWorryLevel = {
  [x: number]: Polynomial;
};

type Monkey = {
  itemWorryLevels: ItemWorryLevel[];
  inspect: (old: ItemWorryLevel) => ItemWorryLevel;
  inspectDescription: string;
  testDivisor: number;
  trueReceiver: number;
  falseReceiver: number;
  itemsInspected: number;
};

async function run() {
  await runDay(partOne, partTwo);
}

export function partOne(input: string[]): number | string {
  const monkeys = parseInput(input);

  runSimulation(
    monkeys,
    20,
    part1WorryManagement,
  );

  return calculateMonkeyBusinessLevel(monkeys).toString();
}

export function partTwo(input: string[]): number | string {
  const monkeys = parseInput(input);

  runSimulation(
    monkeys,
    10000,
    part2WorryManagement,
  );

  return calculateMonkeyBusinessLevel(monkeys).toString();
}

export function runSimulation(
  monkeys: Monkey[],
  rounds: number,
  manageWorry?: (worry: ItemWorryLevel) => ItemWorryLevel,
  summaryLog?: (...args: unknown[]) => void,
  detailLog?: (...args: unknown[]) => void,
) {
  for (let i = 0; i < rounds; i++) {
    detailLog && detailLog("== Round %d ==", i + 1);
    monkeys.forEach((monkey, monkeyIndex) => {
      detailLog && detailLog("Monkey %d:", monkeyIndex);
      while (monkey.itemWorryLevels.length > 0) {
        const itemWorryLevel = monkey.itemWorryLevels.shift();
        if (!itemWorryLevel) throw new Error();

        detailLog && detailLog(
          "  Monkey inspects an item with a worry level of %d.",
          evaluateWorryLevel(itemWorryLevel),
        );

        // monkey inspects, that pushes worry level up
        let newItemWorryLevel = monkey.inspect(itemWorryLevel);

        detailLog && detailLog(
          "    Worry level %s to %d.",
          monkey.inspectDescription.replace(/\+ (\d+)/, "increases by $1")
            .replace(/\^2/, "is multiplied by itself")
            .replace(/\* (\d+)/, "is multiplied by $1"),
          evaluateWorryLevel(newItemWorryLevel),
        );

        // monkey stops inspecting, that _can_ push worry level down
        if (manageWorry) {
          newItemWorryLevel = manageWorry(newItemWorryLevel);
          detailLog && detailLog(
            "    Worry managed down to %d.",
            evaluateWorryLevel(newItemWorryLevel),
          );
        }

        const passesTest = newItemWorryLevel[monkey.testDivisor] &&
          newItemWorryLevel[monkey.testDivisor][0] %
                BigInt(monkey.testDivisor) === 0n;

        detailLog && detailLog(
          "    Current worry level %s divisible by %d.",
          passesTest ? "is" : "is not",
          monkey.testDivisor,
        );

        const receiver = passesTest
          ? monkey.trueReceiver
          : monkey.falseReceiver;

        detailLog &&
          detailLog(
            "    Item with worry level %d is thrown to monkey %d.",
            evaluateWorryLevel(newItemWorryLevel),
            receiver,
          );

        monkeys[receiver].itemWorryLevels.push(newItemWorryLevel);
        monkey.itemsInspected++;
      }
    });

    if (summaryLog) {
      summaryLog(
        "After round %d, the monkeys are holding items with these worry levels:",
        i + 1,
      );

      monkeys.forEach((monkey, monkeyIndex) => {
        summaryLog(
          "Monkey %d: %s",
          monkeyIndex,
          monkey.itemWorryLevels.map(evaluateWorryLevel).join(", "),
        );
      });
    }
  }
}

export function calculateMonkeyBusinessLevel(monkeys: Monkey[]): number {
  monkeys = [...monkeys].sort((x, y) => {
    if (x.itemsInspected === y.itemsInspected) {
      return 0;
    } else if (x.itemsInspected < y.itemsInspected) {
      return 1;
    } else {
      return -1;
    }
  });

  return monkeys.slice(0, 2).reduce(
    (total, monkey) => total * monkey.itemsInspected,
    1,
  );
}

export function parseInput(input: string[]): Monkey[] {
  const monkeys = input.reduce<Monkey[]>(
    (result, line) => {
      if (/^Monkey \d+/.test(line)) {
        result.push({
          inspectDescription: "no-op",
          itemWorryLevels: [],
          testDivisor: 1,
          inspect: (old) => old,
          trueReceiver: -1,
          falseReceiver: -1,
          itemsInspected: 0,
        });
        return result;
      }

      const monkey = result[result.length - 1];

      let m = /Starting items: (.+)/.exec(line);
      if (m) {
        monkey.itemWorryLevels = m[1].split(",").map((raw) =>
          parseInt(raw.trim(), 10)
        ).map((value) => ({ 1: [0n, BigInt(value)] }));
      }

      m = /Operation: new = old ([+*]) (\d+|old)/.exec(line);
      if (m) {
        if (m[2] === "old") {
          if (m[1] !== "*") {
            throw new Error("can only multiply by <old>");
          }
          monkey.inspect = inspectThroughSquaring;
          monkey.inspectDescription = "^2";
        } else if (m[1] === "+") {
          const value = parseInt(m[2], 10);
          monkey.inspect = inspectThroughAddition.bind(undefined, value);
          monkey.inspectDescription = `+ ${value}`;
        } else if (m[1] === "*") {
          const value = parseInt(m[2], 10);
          monkey.inspect = inspectThroughMultiplication.bind(undefined, value);
          monkey.inspectDescription = `* ${value}`;
        } else {
          throw new Error();
        }
        return result;
      }

      m = /Test: divisible by (\d+)/.exec(line);
      if (m) {
        monkey.testDivisor = parseInt(m[1], 10);
        return result;
      }

      m = /If (true|false): throw to monkey (\d+)/.exec(line);
      if (m) {
        const key = m[1] === "true" ? "trueReceiver" : "falseReceiver";
        const receiverIndex = parseInt(m[2], 10);
        monkey[key] = receiverIndex;
        return result;
      }

      return result;
    },
    [],
  );

  // After we have each monkey's divisor, we need to go through and
  // initialize the itemWorryLevel arrays
  const primeFactors = monkeys.map((m) => m.testDivisor);
  return monkeys.map((monkey) => {
    return {
      ...monkey,
      itemWorryLevels: monkey.itemWorryLevels.map((l) => {
        const value = polynomial.evaluate(l[1], 1);
        return primeFactors.reduce<ItemWorryLevel>(
          function (result, factor) {
            result[factor] = distributeConstant(
              polynomial(value),
              factor,
            );

            return result;
          },
          {},
        );
      }),
    };
  });
}

export function inspectThroughAddition(
  amount: number,
  old: ItemWorryLevel,
): ItemWorryLevel {
  const primeFactors = Object.keys(old).map(Number);

  return primeFactors.reduce<ItemWorryLevel>(
    function (result, factor) {
      // old[factor] is a single-variable polynomial, where the variable is a
      // prime factor. Here we add <amount> to its constant value, then pull as
      // much as possible out into the first coefficient
      const sum = polynomial.addConstant(old[factor], amount);

      result[factor] = distributeConstant(sum, factor);

      return result;
    },
    {},
  );
}

export function inspectThroughMultiplication(
  amount: number,
  old: ItemWorryLevel,
): ItemWorryLevel {
  const primeFactors = Object.keys(old).map(Number);
  return primeFactors.reduce<ItemWorryLevel>(
    function (result, factor) {
      result[factor] = distributeConstant(
        polynomial.multiply(old[factor], amount),
        factor,
      );
      return result;
    },
    {},
  );
}

export function inspectThroughSquaring(old: ItemWorryLevel): ItemWorryLevel {
  const primeFactors = Object.keys(old).map(Number);
  return primeFactors.reduce<ItemWorryLevel>(
    function (result, factor) {
      const p = distributeConstant(
        polynomial.multiply(
          old[factor],
          old[factor],
        ),
        factor,
      );

      result[factor] = p;

      return result;
    },
    {},
  );
}

export function part1WorryManagement(
  old: ItemWorryLevel,
): ItemWorryLevel {
  const primeFactors = Object.keys(old).map(Number);
  return primeFactors.reduce<ItemWorryLevel>(
    function (result, factor) {
      // evaluate each polynomial and divide the result by 3 (integer division)
      // this is our new polynomial (just a constant value)
      const value = polynomial.evaluate(old[factor], factor);
      result[factor] = distributeConstant([value / 3n], factor);

      return result;
    },
    {},
  );
}

export function part2WorryManagement(
  old: ItemWorryLevel,
): ItemWorryLevel {
  // my main worry in part 2 is that the numbers get so big i can't
  // represent them with all the atoms in the universe
  // it turns out that we really only need the constant part of each polynomial
  // for the math to work, so here we discard everything else
  const primeFactors = Object.keys(old).map(Number);
  return primeFactors.reduce<ItemWorryLevel>(
    function (result, factor) {
      result[factor] = old[factor].slice(0, 1);
      return result;
    },
    {},
  );
}

function distributeConstant(p: Polynomial, x: number | bigint): Polynomial {
  // Distributes as much of the constant in <p> into the first coefficient
  // based on the given value of <x>

  x = BigInt(x);

  if (x === 0n) {
    throw new Error();
  }

  const addToCoefficient = (p[0] ?? 0n) / x;
  const newConstant = p[0] % x;

  const result = [...p];
  result[0] = newConstant;
  result[1] = (result[1] ?? 0n) + addToCoefficient;

  return result;
}

function evaluateWorryLevel(l: ItemWorryLevel): number {
  const primeFactors = Object.keys(l).map(Number);
  const factor = primeFactors[0];

  const result = Number(polynomial.evaluate(l[factor], factor));

  return result;
}

if (import.meta.main) {
  await run();
}
