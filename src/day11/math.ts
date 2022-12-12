// nth-degree polynomial, with index holding corresponding value for that position,
// e.g. [5,3] = 3x + 5
export type Polynomial = bigint[];

export default Object.assign(make, {
  addConstant,
  multiply,
  evaluate,
  stringify,
});

function make(...args: (number | bigint)[]): Polynomial {
  return args.map((value) => BigInt(value));
}

function addConstant(lhs: Polynomial, rhs: number | bigint): Polynomial {
  const result = [...lhs];
  result[0] = (result[0] ?? 0n) + BigInt(rhs);
  return result;
}

function multiply(
  lhs: Polynomial,
  rhs: Polynomial | number | bigint,
): Polynomial {
  const rhsAsPolynomial = typeof rhs === "number" || typeof rhs === "bigint"
    ? [BigInt(rhs)]
    : rhs;

  const result = Array(lhs.length + rhsAsPolynomial.length - 1).fill(0n);

  lhs.forEach((lhsValue, lhsIndex) => {
    rhsAsPolynomial.forEach((rhsValue, rhsIndex) => {
      result[lhsIndex + rhsIndex] += lhsValue * rhsValue;
    });
  });

  return result;
}

function evaluate(p: Polynomial, x: number | bigint): bigint {
  return p.reduce(
    (result, coefficient, position) => {
      let value = 1n;
      for (let i = 0; i < position; i++) {
        value *= BigInt(x);
      }

      return result + (coefficient * value);
    },
    0n,
  );
}

function stringify(p: Polynomial): string {
  return [...p]
    .map((coefficient, power) => {
      if (coefficient === 0n) {
        return "";
      } else if (power === 0) {
        return coefficient.toString();
      } else if (power === 1) {
        return `${coefficient}x`;
      } else {
        return `${coefficient}x^${power}`;
      }
    }).filter((x) => x !== "").reverse().join(" + ");
}
