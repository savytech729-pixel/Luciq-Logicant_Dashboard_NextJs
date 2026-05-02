/**
 * Recover project lists from raw CV/OCR text when the model omits tabular
 * "LIST OF PROJECTS" blocks (common on architecture / construction CVs).
 */

const SECTION_START =
  /(?:^|\n)\s*(?:LIST\s+OF\s+PROJETC(?:D|DS)|LIST\s+OF\s+PROJECTS?|KEY\s+PROJECTS?|MAJOR\s+PROJECTS?|NOTABLE\s+PROJECTS?|PROJECT\s+LIST|PROJECTS\s+UNDERTAKEN|PROJECT\s+EXPERIENCE|DETAILS\s+OF\s+PROJECTS?)\b[^\n]*(?:\n|$)/i;

/** Table header row often survives OCR when section title does not. */
const TABLE_HEADER_ROW =
  /(?:^|\n)\s*Project\s+Title\b[^\n]*Project\s+Type\b[^\n]*Responsibilit(?:y|ies)\b[^\n]*(?:\n|$)/i;

const SECTION_END =
  /(?:^|\n)\s*(?:EDUCATION|WORK\s+EXPERIENCE|EMPLOYMENT|EMPLOYMENT\s+HISTORY|PROFESSIONAL\s+EXPERIENCE|EXPERIENCE\s*SUMMARY|REFERENCES?|DECLARATION|CERTIFICATIONS?|ACADEMIC|ACADEMICS|SKILLS(?:\s*SET)?|PROGRAMMING\s+LANGUAGES|COMPUTER\s+SKILLS|TECHNICAL\s+SKILLS|ACHIEVEMENTS?|PERSONAL\s+(?:DETAILS|PROFILE|INFORMATION)|CAREER\s+OBJECTIVE|ABOUT\s+ME|CONTACT\s*(?:DETAILS)?|INTERESTS?|HOBBIES|LANGUAGE(?:S)?\s*(?:KNOWN)?)\b[^\n]*(?:\n|$)/i;

export function extractProjectsSectionFromCvText(text: string, maxLen = 25_000): string {
  if (!text?.trim()) return "";
  const normalized = text.replace(/\r\n/g, "\n");

  let m = normalized.match(SECTION_START);
  let startIdx = m && m.index !== undefined ? m.index + m[0].length : -1;

  if (startIdx < 0) {
    m = normalized.match(TABLE_HEADER_ROW);
    if (m && m.index !== undefined) startIdx = m.index;
  }

  if (startIdx < 0) return "";

  const rest = normalized.slice(startIdx);
  const endMatch = SECTION_END.exec(rest);
  const slice = endMatch ? rest.slice(0, endMatch.index) : rest;
  let out = slice.trim();
  if (!out) return "";
  if (out.length > maxLen) out = `${out.slice(0, maxLen)}\n[... truncated ...]`;
  return out.replace(/\n{4,}/g, "\n\n\n");
}
