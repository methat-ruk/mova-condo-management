export function sqmToDimensions(area: number): { w: string; h: string } {
  const side = Math.sqrt(area);
  const fmt = (n: number) =>
    Number.isInteger(Math.round(n * 10) / 10)
      ? String(Math.round(n))
      : (Math.round(n * 10) / 10).toFixed(1);
  const s = fmt(side);
  return { w: s, h: s };
}

export interface UnitSize {
  key: "S" | "M" | "L" | "XL";
  area: number;
  bedrooms: number;
  bathrooms: number;
}

export const UNIT_SIZES: UnitSize[] = [
  { key: "S", area: 25, bedrooms: 1, bathrooms: 1 },
  { key: "M", area: 35, bedrooms: 1, bathrooms: 1 },
  { key: "L", area: 50, bedrooms: 2, bathrooms: 1 },
  { key: "XL", area: 70, bedrooms: 2, bathrooms: 2 },
];

export function getSizeKey(area: number): "S" | "M" | "L" | "XL" | null {
  if (area < 30) return "S";
  if (area < 45) return "M";
  if (area < 65) return "L";
  if (area >= 65) return "XL";
  return null;
}
