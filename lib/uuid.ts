const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * True when `value` is a well-formed UUID string.
 *
 * Use this to guard values that flow into a `uuid` column filter. Passing a
 * non-UUID string (e.g. the literal "undefined" from a malformed link) to
 * Postgres raises `22P02 invalid input syntax for type uuid`, which surfaces
 * as a logged error even when the calling code handles the empty result.
 */
export function isUuid(value: string | null | undefined): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}
