/** Gemini / Document AI behave better with precise MIME types than browser fallbacks like application/octet-stream. */
export function normalizeCvMimeType(fileName: string, mimeType: string): string {
  const m = (mimeType || "").toLowerCase().trim();
  const base = fileName.split(/[/\\]/).pop()?.toLowerCase() || "";

  if (m.includes("pdf") || base.endsWith(".pdf")) return "application/pdf";
  if (base.endsWith(".docx") || m.includes("wordprocessingml")) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  if (base.endsWith(".doc") || m === "application/msword") return "application/msword";
  if (base.endsWith(".txt") || m.startsWith("text/")) return "text/plain";
  if (m.startsWith("image/")) return mimeType || "image/png";

  if (m === "application/octet-stream" || !m) {
    if (base.endsWith(".pdf")) return "application/pdf";
    if (base.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    if (base.endsWith(".doc")) return "application/msword";
  }

  return mimeType || "application/octet-stream";
}
