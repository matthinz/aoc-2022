/**
 * Reducer for calculating sum.
 */
export function sum<T extends number>(total: T, value: T) {
  return total + value;
}
