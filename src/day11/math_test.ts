import polynomial from "./math.ts";
import { assertEquals } from "https://deno.land/std@0.167.0/testing/asserts.ts";

Deno.test("#addConstant", () => {
  const result = polynomial.addConstant(
    polynomial(3, 5),
    7,
  );
  assertEquals(result, polynomial(10, 5));
});

Deno.test("polynomial multiplication", () => {
  const result = polynomial.multiply(
    polynomial(5, 0, 10, 6),
    polynomial(1, 2, 4),
  );
  assertEquals(result, polynomial(5, 10, 30, 26, 52, 24));
});

Deno.test("polynomial multiplication by constant", () => {
  const result = polynomial.multiply(
    polynomial(6, 8),
    polynomial(7),
  );
  assertEquals(result, polynomial(42, 56));
});

Deno.test("polynomial evaluation", () => {
  const result = polynomial.evaluate(polynomial(1, 2, 3, 4, 5), 2);
  assertEquals(
    result,
    BigInt(
      1 + (2 * 2) + (3 * Math.pow(2, 2)) + (4 * Math.pow(2, 3)) +
        (5 * Math.pow(2, 4)),
    ),
  );
});
