/**
 * Converts area in sqm to approximate dimensions (side x side).
 * Returns rounded values to 1 decimal place, dropping ".0" if whole number.
 * e.g. 16 sqm → "4x4", 35 sqm → "5.9x5.9"
 */
export function sqmToDimensions(area: number): { w: string; h: string } {
  const side = Math.sqrt(area);
  const fmt = (n: number) => (Number.isInteger(Math.round(n * 10) / 10) ? String(Math.round(n)) : (Math.round(n * 10) / 10).toFixed(1));
  const s = fmt(side);
  return { w: s, h: s };
}
