export function formatStageProbability(value?: number | string | null): string | null {
  if (value === null || value === undefined) return null;

  const num = Number(value);
  if (Number.isNaN(num)) return null;

  const rounded = Math.round(num);
  if (rounded <= 0) return null;

  return `${rounded}%`;
}
