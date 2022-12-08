import { getInputLines } from "../utils.ts";

await run();

async function run() {
  const input = await getInputLines();
  console.log(partOne(input));
  console.log(partTwo(input));
}

function partOne(input: string[]): number {
  let visibleCount = 0;

  for (let y = 0; y < input.length; y++) {
    const row = input[y].split("").map((c) => parseInt(c, 10));

    for (let x = 0; x < row.length; x++) {
      const treeHeight = row[x];

      const isVisibleFromLeft = row
        .slice(0, x)
        .every((otherHeight) => otherHeight < treeHeight);

      const isVisibleFromRight = row
        .slice(x + 1)
        .every((otherHeight) => otherHeight < treeHeight);

      let isVisibleFromTop = true;
      for (let y1 = y - 1; y1 >= 0; y1--) {
        const otherHeight = parseInt(input[y1][x], 10);
        if (otherHeight >= treeHeight) {
          isVisibleFromTop = false;
          break;
        }
      }

      let isVisibleFromBottom = true;
      for (let y1 = y + 1; y1 < input.length; y1++) {
        const otherHeight = parseInt(input[y1][x], 10);
        if (otherHeight >= treeHeight) {
          isVisibleFromBottom = false;
          break;
        }
      }

      if (
        isVisibleFromLeft ||
        isVisibleFromRight ||
        isVisibleFromTop ||
        isVisibleFromBottom
      ) {
        visibleCount++;
      }
    }
  }

  return visibleCount;
}

function partTwo(input: string[]): number {
  let highestScore = 0;

  for (let y = 0; y < input.length; y++) {
    const row = input[y].split("").map((c) => parseInt(c, 10));

    for (let x = 0; x < row.length; x++) {
      const treeHeight = row[x];

      let visibleToTheLeft = 0;
      for (let x1 = x - 1; x1 >= 0; x1--) {
        const otherHeight = row[x1];
        visibleToTheLeft++;
        if (otherHeight >= treeHeight) {
          break;
        }
      }

      let visibleToTheRight = 0;
      for (let x1 = x + 1; x1 < row.length; x1++) {
        const otherHeight = row[x1];
        visibleToTheRight++;
        if (otherHeight >= treeHeight) {
          break;
        }
      }

      let visibleAbove = 0;
      for (let y1 = y - 1; y1 >= 0; y1--) {
        const otherHeight = parseInt(input[y1][x], 10);
        visibleAbove++;
        if (otherHeight >= treeHeight) {
          break;
        }
      }

      let visibleBelow = 0;
      for (let y1 = y + 1; y1 < input.length; y1++) {
        const otherHeight = parseInt(input[y1][x], 10);
        visibleBelow++;
        if (otherHeight >= treeHeight) {
          break;
        }
      }

      const scenicScore = visibleToTheLeft * visibleToTheRight * visibleBelow *
        visibleAbove;

      if (scenicScore > highestScore) {
        highestScore = scenicScore;
      }
    }
  }
  return highestScore;
}
