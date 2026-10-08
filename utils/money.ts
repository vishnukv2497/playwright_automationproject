/**
 * Money helpers. Amounts are handled as integer cents so sums and tax don't pick up floating-point errors.
 */

/** "$29.99" or "Item total: $29.99" -> 2999 */
export function toCents(text: string): number {
    const match = text.match(/\$(\d+)\.(\d{2})/);
    if (!match) {
        throw new Error(`No dollar amount found in "${text}"`);
    }
    return Number(match[1]) * 100 + Number(match[2]);
}

/** 2999 -> "$29.99" */
export function formatCents(cents: number): string {
    return `$${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}`;
}
