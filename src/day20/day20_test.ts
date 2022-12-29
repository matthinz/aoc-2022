import { assertEquals } from "https://deno.land/std@0.167.0/testing/asserts.ts";
import { partOne, partTwo } from "./day20.ts";

const INPUT = `
1
2
-3
3
-2
0
4
`.trim().split("\n");

Deno.test("#partOne", () => {
  const result = partOne(INPUT);
  assertEquals(result, 3);
});

Deno.test("#partTwo", () => {
  const result = partTwo(INPUT);
  assertEquals(result, "");
});
