/** Normalize Mongo extended JSON or string ids from $runCommandRaw results. */
export function normalizeDocumentId(raw: unknown): string {
  if (raw == null) return "";
  if (typeof raw === "string") return raw;
  if (typeof raw === "object" && raw !== null && "$oid" in raw && typeof (raw as { $oid: string }).$oid === "string") {
    return (raw as { $oid: string }).$oid;
  }
  return String(raw);
}

export function isLikelyObjectId(s: string): boolean {
  return /^[a-f0-9]{24}$/i.test(s);
}
