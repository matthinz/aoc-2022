import { assertEquals } from "https://deno.land/std@0.167.0/testing/asserts.ts";
import { findCombinations, findSubsets } from "./subsets.ts";

Deno.test("#findSubsets()", () => {
  const input = [1, 2, 3];
  const expected = [
    [1],
    [2],
    [3],
    [1, 2],
    [1, 3],
    [2, 3],
    [1, 2, 3],
  ];
  const actual = findSubsets(input);
  assertEquals(actual, expected);
});

Deno.test("#findSubsets(T[], min)", () => {
  const input = [1, 2, 3];
  const expected = [
    [1, 2],
    [1, 3],
    [2, 3],
    [1, 2, 3],
  ];
  assertEquals(findSubsets(input, 2), expected);
});

Deno.test("#findSubsets(T[], min, max)", () => {
  const input = [1, 2, 3];
  const expected = [
    [1, 2],
    [1, 3],
    [2, 3],
  ];
  assertEquals(findSubsets(input, 2, 2), expected);
});

Deno.test("#findCombinations", () => {
  const input = [1, 2, 3, 4];
  const expected = [[1, 2], [1, 3], [1, 4], [2, 3], [2, 4], [3, 4]];
  const actual = findCombinations(input, 2);
  assertEquals(actual, expected);
});
