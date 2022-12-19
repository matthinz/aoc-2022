import { assertEquals } from "https://deno.land/std@0.167.0/testing/asserts.ts";
import { Board } from "./board.ts";
import { createCircularReader, partOne, partTwo, tick } from "./day17.ts";
import { ROCKS } from "./rock.ts";

const INPUT = `
>>><<><>><<<>><>>><<<>>><<<><<<>><>><<>>
`.trim().split("\n");

Deno.test("#partOne", () => {
  const result = partOne(INPUT);
  assertEquals(result, 3068);
});

Deno.test("#partTwo", () => {
  const result = partTwo(INPUT);
  assertEquals(result, 1514285714288);
});

Deno.test("#createCircularReader", () => {
  const reader = createCircularReader(
    "<><><>".split(""),
  );

  const actual: string[] = [];

  for (let i = 0; i < 10; i++) {
    actual.push(reader() as string);
  }

  assertEquals(
    actual.join(""),
    "<><><><><>",
  );
});

Deno.test("#tick", () => {
  const board = new Board(7, 10);
  const nextJet = createCircularReader(INPUT.join("").split(""));
  const nextRock = createCircularReader(ROCKS);

  tick(board, nextJet, nextRock);

  assertEquals(
    board.stringify(),
    `
----------
9|       |
8|       |
7|       |
6|       |
5|       |
4|       |
3|  @@@@ |
2|       |
1|       |
0|       |
----------
  0123456|
----------
`.trim(),
  );

  tick(board, nextJet, nextRock);

  assertEquals(
    board.stringify(),
    `
----------
9|       |
8|       |
7|       |
6|       |
5|       |
4|       |
3|       |
2|   @@@@|
1|       |
0|       |
----------
  0123456|
----------
`.trim(),
  );

  tick(board, nextJet, nextRock);

  assertEquals(
    board.stringify(),
    `
----------
9|       |
8|       |
7|       |
6|       |
5|       |
4|       |
3|       |
2|       |
1|   @@@@|
0|       |
----------
  0123456|
----------
`.trim(),
  );

  tick(board, nextJet, nextRock);

  assertEquals(
    board.stringify(),
    `
----------
9|       |
8|       |
7|       |
6|       |
5|       |
4|       |
3|       |
2|       |
1|       |
0|   @@@@|
----------
  0123456|
----------
`.trim(),
  );

  tick(board, nextJet, nextRock);

  assertEquals(
    board.stringify(),
    `
----------
9|       |
8|       |
7|       |
6|       |
5|       |
4|       |
3|       |
2|       |
1|       |
0|  #### |
----------
  0123456|
----------
`.trim(),
  );

  for (let i = 0; i < 8; i++) {
    tick(board, nextJet, nextRock);
  }

  assertEquals(board.highestRockY, 3);

  assertEquals(
    board.stringify(),
    `
----------
9|       |
8|       |
7|    @  |
6|    @  |
5|  @@@  |
4|       |
3|   #   |
2|  ###  |
1|   #   |
0|  #### |
----------
  0123456|
----------
`.trim(),
  );
});
