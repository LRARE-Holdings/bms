/**
 * Return a YYYY-MM-DD string in the local timezone (not UTC).
 * `new Date().toISOString().split("T")[0]` returns UTC, which is wrong
 * during BST or any UTC+ offset — e.g. 11pm on 31 Mar BST is 1 Apr UTC.
 */
export function localDateStr(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Same as localDateStr but for converting an existing Date that was
 * constructed from a local date string (e.g. via `new Date(str + "T00:00:00")`).
 */
export function dateToDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
