export function boundedValue(n: number, lower: number, upper: number) {
  return Math.min(Math.max(n, lower), upper);
}
