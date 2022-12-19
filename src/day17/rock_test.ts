import { assertEquals } from "https://deno.land/std@0.167.0/testing/asserts.ts";
import { ROCKS } from "./rock.ts";

Deno.test("#height", () => {
  assertEquals(ROCKS[0].height, 1);
});
