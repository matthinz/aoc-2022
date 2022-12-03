import { getInputLines } from "../utils";

run().catch((err) => {
  process.exitCode = 1;
  console.error(err);
});

async function run() {
  const input = await getInputLines();
  console.log(partOne(input));
  console.log(partTwo(input));
}

function partOne(input: string[]): number {
  return input.reduce(function (total, line) {
    const first = line.substring(0, line.length / 2);
    const second = line.substring(line.length / 2);

    // find item in first also present in second
    const item = first.split("").find((c) => {
      return second.indexOf(c) >= 0;
    });

    if (!item) {
      throw new Error();
    }

    // lowercase priority = 1-26
    // uppercase = 27 - 52
    const c = item.charCodeAt(0);
    let priority: number;

    if (item.toUpperCase() === item) {
      // uppercase ascii A=65
      priority = c - 65 + 27;
    } else if (item.toLowerCase() === item) {
      priority = c - 97 + 1;
    } else throw new Error();

    return total + priority;

    return 0;
  }, 0);
}

function partTwo(input: string[]): number {
  return 0;
}
