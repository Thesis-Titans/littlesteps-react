const EMPTY_MATERIAL_VALUES = new Set([
  "none",
  "none required",
  "none needed",
  "no materials",
  "no materials needed",
  "n/a",
]);

/**
 * Filters out placeholder values like `"none"` or `"None required"` so UI cards can display
 * a calm `"No materials needed"` label instead of a literal `"none"` bullet.
 */
export function normalizeMaterials(materials: readonly string[]): string[] {
  return materials
    .map((item) => item.trim())
    .filter((item) => item.length > 0 && !EMPTY_MATERIAL_VALUES.has(item.toLowerCase()));
}
