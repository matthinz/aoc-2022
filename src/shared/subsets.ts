export function findSubsets<T>(
  items: T[],
  minLength?: number,
  maxLength?: number,
): T[][] {
  if (minLength == null) {
    return findSubsets(items, 1, maxLength);
  }

  if (maxLength == null) {
    return findSubsets(items, minLength, items.length);
  }

  if (minLength === maxLength) {
    return findCombinations(items, minLength);
  }

  const result: T[][] = [];

  for (let len = minLength; len <= maxLength; len++) {
    result.push(...findCombinations(items, len));
  }

  return result;
}

/**
 * @returns An array of arrays with all combinations of length <length> of items in <items>
 */
export function findCombinations<T>(
  items: T[],
  length: number,
  prev: T[] = [],
): T[][] {
  if (prev.length === length) {
    return [prev];
  }

  const result: T[][] = [];
  items.forEach((item, index) => {
    const next = [...prev, item];

    findCombinations(items.slice(index + 1), length, next).forEach((c) =>
      result.push(c)
    );
  });
  return result;
}
