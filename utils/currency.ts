export function parseCurrency(value: string): number {
  const amount = Number(value.replace(/[^\d.]/g, ''));
  if (!Number.isFinite(amount)) {
    throw new Error(`Invalid currency value: ${value}`);
  }
  return Math.round(amount * 100);
}