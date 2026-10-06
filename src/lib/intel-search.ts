/** Local-only filtering of already loaded public news. */
export type IntelSearchItem = { headline?: string; publisher?: string; tickers?: string[]; summary?: string; categories?: string[] };
export function normalizeIntelSearch(value: unknown): string {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ").toLowerCase() : "";
}
export function filterIntelItems<T extends IntelSearchItem>(items: T[], category: string, searchTerm: string): T[] {
  const selectedCategory = normalizeIntelSearch(category) || "all";
  const query = normalizeIntelSearch(searchTerm);
  return (Array.isArray(items) ? items : []).filter((item) => {
    if (!item || typeof item !== "object") return false;
    const inCategory = selectedCategory === "all" || (Array.isArray(item.categories) && item.categories.some((value) => normalizeIntelSearch(value) === selectedCategory));
    if (!inCategory) return false;
    if (!query) return true;
    const haystack = [item.headline, item.publisher, item.summary, ...(Array.isArray(item.tickers) ? item.tickers : [])].map(normalizeIntelSearch).join(" ");
    return haystack.includes(query);
  });
}
