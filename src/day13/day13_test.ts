import { assertEquals } from "https://deno.land/std@0.167.0/testing/asserts.ts";
import { partOne } from "./day13.ts";

const INPUT = `
[1,1,3,1,1]
[1,1,5,1,1]

[[1],[2,3,4]]
[[1],4]

[9]
[[8,7,6]]

[[4,4],4,4]
[[4,4],4,4,4]

[7,7,7,7]
[7,7,7]

[]
[3]

[[[]]]
[[]]

[1,[2,[3,[4,[5,6,7]]]],8,9]
[1,[2,[3,[4,[5,6,0]]]],8,9]
`.trim().split("\n");

Deno.test("#partOne", () => {
  const result = partOne(INPUT);
  assertEquals(result, 13);
});
