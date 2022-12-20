import { assertEquals } from "https://deno.land/std@0.167.0/testing/asserts.ts";
import { Board } from "./board.ts";
import { CircularBuffer } from "./circular_buffer.ts";
import { partOne, partTwo } from "./day17.ts";
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

Deno.test("#tick", () => {
  const nextJet = new CircularBuffer(INPUT.join("").split(""));
  const nextRock = new CircularBuffer(ROCKS);
  const board = new Board(7, nextJet, nextRock);

  board.tick();

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

  board.tick();

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

  board.tick();

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

  board.tick();

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

  board.tick();

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
    board.tick();
  }

  assertEquals(board.maxY, 3);

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
