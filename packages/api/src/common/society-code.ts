/**
 * Society codes are what residents type when signing up, e.g. "AMA-001".
 * Stored upper case; matching is case-insensitive via normalizeSocietyCode.
 */

/** "  ama-001 " -> "AMA-001" */
export function normalizeSocietyCode(input: string): string {
  return input.trim().toUpperCase();
}

/** "AMA Grand Estate" -> "AMA"; "Orchid Towers" -> "ORCH"; "123 Plaza" -> "SOC". Same rule as the backfill migration. */
export function societyCodePrefix(name: string): string {
  const firstWord = name.trim().split(' ')[0] ?? '';
  const letters = firstWord.replace(/[^A-Za-z]/g, '').slice(0, 4).toUpperCase();
  return letters || 'SOC';
}

/** Next free code for a prefix given the codes already used, e.g. ["AMA-001", "AMA-002"] -> "AMA-003". */
export function nextSocietyCode(prefix: string, existingCodes: string[]): string {
  const pattern = new RegExp(`^${prefix}-(\\d+)$`);
  const highest = existingCodes.reduce((max, code) => {
    const match = pattern.exec(code);
    return match ? Math.max(max, parseInt(match[1], 10)) : max;
  }, 0);
  return `${prefix}-${String(highest + 1).padStart(3, '0')}`;
}

/** Prisma filter that finds a society by its code (any case) or its ID. */
export function societyLookup(input: string) {
  const trimmed = input.trim();
  return { OR: [{ code: normalizeSocietyCode(trimmed) }, { id: trimmed }] };
}
