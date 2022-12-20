import { assertEquals } from "https://deno.land/std@0.167.0/testing/asserts.ts";
import { CircularBuffer } from "./circular_buffer.ts";

Deno.test("CircularBuffer", () => {
  const buffer = new CircularBuffer(
    "<><".split(""),
  );

  assertEquals(buffer.index, -1);

  const actual: string[] = [];

  for (let i = 0; i < 10; i++) {
    actual.push(buffer.next());
  }

  assertEquals(
    actual,
    [
      "<",
      ">",
      "<",
      "<",
      ">",
      "<",
      "<",
      ">",
      "<",
      "<",
    ],
  );
});
