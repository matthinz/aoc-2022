import { assertEquals } from "https://deno.land/std@0.167.0/testing/asserts.ts";
import { createCircularReader, partOne, partTwo } from "./day17.ts";

const INPUT = `
>>><<><>><<<>><>>><<<>>><<<><<<>><>><<>>
`.trim().split("\n");

Deno.test("#partOne", () => {
  const result = partOne(INPUT);
  assertEquals(result, 3068);
});

Deno.test("#partTwo", () => {
  const result = partTwo(INPUT);
  assertEquals(result, "");
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
