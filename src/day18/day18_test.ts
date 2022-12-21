import { assertEquals } from "https://deno.land/std@0.167.0/testing/asserts.ts";
import { partOne, partTwo } from "./day18.ts";

const INPUT = `
2,2,2
1,2,2
3,2,2
2,1,2
2,3,2
2,2,1
2,2,3
2,2,4
2,2,6
1,2,5
3,2,5
2,1,5
2,3,5
`.trim().split("\n");

Deno.test("#partOne", () => {
  const result = partOne(INPUT);
  assertEquals(result, 64);
});

Deno.test("#partTwo", () => {
  const result = partTwo(INPUT);
  assertEquals(result, 58);
});
