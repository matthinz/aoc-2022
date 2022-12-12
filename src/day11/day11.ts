import { runDay } from "../utils.ts";

type Monkey = {
  items: number[];
  op: (old: number) => number;
  test: (value: number) => boolean;
  trueReceiver: number;
  falseReceiver: number;
  itemsInspected: number;
};

async function run() {
  await runDay(partOne, partTwo);
}

export function partOne(input: string[]): number | string {
  const monkeys = parseInput(input);

  runSimulation(monkeys, 20);

  monkeys.sort((x, y) => {
    return y.itemsInspected - x.itemsInspected;
  });

  const monkeyBusinessLevel = monkeys.slice(0, 2).reduce(
    (total, monkey) => total * monkey.itemsInspected,
    1,
  );

  return monkeyBusinessLevel;
}

export function partTwo(input: string[]): number | string {
  return "";
}

export function runSimulation(monkeys: Monkey[], rounds: number) {
  for (let i = 0; i < rounds; i++) {
    monkeys.forEach((monkey) => {
      while (monkey.items.length > 0) {
        let itemWorryLevel = monkey.items.shift();
        if (!itemWorryLevel) throw new Error();
        // monkey inspects, that pushes worry level up
        itemWorryLevel = monkey.op(itemWorryLevel);
        // monkey stops inspecting, that pushes worry level down
        itemWorryLevel = Math.floor(itemWorryLevel / 3);

        const receiver = monkey.test(itemWorryLevel)
          ? monkey.trueReceiver
          : monkey.falseReceiver;

        monkeys[receiver].items.push(itemWorryLevel);

        monkey.itemsInspected++;
      }
    });
  }
}

export function parseInput(input: string[]): Monkey[] {
  return input.reduce<Monkey[]>(
    (result, line) => {
      if (/^Monkey \d+/.test(line)) {
        result.push({
          items: [],
          op: (x) => x,
          test: (_value) => false,
          trueReceiver: -1,
          falseReceiver: -1,
          itemsInspected: 0,
        });
        return result;
      }

      const monkey = result[result.length - 1];

      let m = /^  Starting items: (.+)/.exec(line);
      if (m) {
        monkey.items = m[1].split(",").map((x) => parseInt(x.trim(), 10));
      }

      m = /^  Operation: new = old ([+*]) (\d+|old)/.exec(line);
      if (m) {
        const operation: (x: number, y: number) => number = m[1] === "+"
          ? (x, y) => x + y
          : (x, y) => x * y;

        let operand: (old: number) => number;

        if (m[2] === "old") {
          operand = (old) => old;
        } else {
          const value = parseInt(m[2], 10);
          operand = (_old) => value;
        }

        monkey.op = (old) => operation(old, operand(old));
        return result;
      }

      m = /  Test: divisible by (\d+)/.exec(line);
      if (m) {
        const divisor = parseInt(m[1], 10);
        monkey.test = (value) => value % divisor === 0;
        return result;
      }

      m = /    If (true|false): throw to monkey (\d+)/.exec(line);
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
}

if (import.meta.main) {
  await run();
}
