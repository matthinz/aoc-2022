export type Point = {
  readonly x: number;
  readonly y: number;
};

export function calculateExtremePoints<P extends Point>(
  ...pointSets: P[][]
): { min: Point; max: Point } {
  const min = {
    x: Infinity,
    y: Infinity,
  };

  const max = {
    x: -Infinity,
    y: -Infinity,
  };

  pointSets.forEach((points) => {
    points.forEach(({ x, y }) => {
      if (x < min.x) {
        min.x = x;
      }
      if (x > max.x) {
        max.x = x;
      }
      if (y < min.y) {
        min.y = y;
      }
      if (y > max.y) {
        max.y = y;
      }
    });
  });

  return { min, max };
}

/**
 * Reducer for calculating sum.
 */
export function sum<T extends number>(total: T, value: T) {
  return total + value;
}

/**
 * @returns Manhattan distance between two points on a 2d plane.
 */
export function manhattanDistance<T extends Point>(a: T, b: T): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}
