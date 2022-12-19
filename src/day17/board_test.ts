import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.167.0/testing/asserts.ts";
import { Board } from "./board.ts";
import { ROCKS } from "./rock.ts";

Deno.test("#canPlaceRock - edges", () => {
  const board = new Board(7, 20);

  const offLeftEdge = ROCKS[0].position(-1, 0);
  assertEquals(
    board.canPlaceRock(offLeftEdge),
    false,
    "should not be able to place off left edge",
  );

  const offRightEdge = ROCKS[0].position(4, 0);
  assertEquals(
    board.canPlaceRock(offRightEdge),
    false,
    "should not be able to place off right edge",
  );

  const offTopEdge = ROCKS[0].position(0, 20);
  assertEquals(
    board.canPlaceRock(offTopEdge),
    false,
    "should not be able to place rock off top edge",
  );

  const offBottomEdge = ROCKS[0].position(0, -1);
  assertEquals(
    board.canPlaceRock(offBottomEdge),
    false,
    "should not be able to place off bottom edge",
  );
});

Deno.test("#canPlaceRock - intersection with shapes", () => {
  const board = new Board(7, 10);
  board.placeRock(
    ROCKS[2].position(4, 6), // backwards "L"
  );
  board.placeRock(
    ROCKS[1].position(0, 7), // Cross
  );

  assertEquals(
    board.stringify(),
    `
----------
9|       |
8|       |
7| #     |
6|###   #|
5| #    #|
4|    ###|
3|       |
2|       |
1|       |
0|       |
----------
  0123456|
----------
        `.trim(),
  );

  assertEquals(
    board.canPlaceRock(
      ROCKS[2].position(2, 7), // backwards "L"
    ),
    true,
  );
  assertEquals(
    board.canPlaceRock(
      ROCKS[2].position(1, 7), // backwards "L"
    ),
    false,
  );
});

Deno.test("#placeRock", () => {
  const board = new Board(7, 10);
  board.placeRock(
    ROCKS[2].position(4, 6), // backwards "L"
  );

  assertEquals(
    board.stringify(),
    `
----------
9|       |
8|       |
7|       |
6|      #|
5|      #|
4|    ###|
3|       |
2|       |
1|       |
0|       |
----------
  0123456|
----------
      `.trim(),
  );

  board.placeRock(
    ROCKS[1].position(0, 7),
  );

  assertEquals(
    board.stringify(),
    `
----------
9|       |
8|       |
7| #     |
6|###   #|
5| #    #|
4|    ###|
3|       |
2|       |
1|       |
0|       |
----------
  0123456|
----------
      `.trim(),
  );
});

Deno.test("#stringify - empty board", () => {
  const board = new Board(7, 10);
  const expected = `
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
0|       |
----------
  0123456|
----------
  `.trim();

  assertEquals(board.stringify(), expected);
});

Deno.test("#stringify - empty board with ghost rock", () => {
  const board = new Board(7, 10);
  const rock = ROCKS[2].position(3, 3);
  assertEquals(
    board.stringify(rock),
    `
----------
9|       |
8|       |
7|       |
6|       |
5|       |
4|       |
3|     @ |
2|     @ |
1|   @@@ |
0|       |
----------
  0123456|
----------
  `.trim(),
  );
  assertEquals(
    board.stringify(rock.position(3, 2)),
    `
----------
9|       |
8|       |
7|       |
6|       |
5|       |
4|       |
3|       |
2|     @ |
1|     @ |
0|   @@@ |
----------
  0123456|
----------
  `.trim(),
  );
});
