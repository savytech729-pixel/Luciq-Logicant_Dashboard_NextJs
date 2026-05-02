/**
 * Aggressive email / phone recovery from OCR or pasted CV text.
 * Document AI often inserts spaces or line breaks inside emails; models sometimes omit contact fields.
 */

function stripBidiAndJoiners(s: string): string {
  return s.replace(/[\u200b-\u200d\ufeff]/g, "");
}

/** Fix "name @ domain . com" and similar OCR splits (single line). */
export function repairSpacedEmailPatterns(text: string): string {
  return text.replace(
    /([\w.%+-]+)\s*@\s*([\w]+)\s*\.\s*([a-z]{2,})/gi,
    (_, a: string, b: string, c: string) => `${a}@${b}.${c}`
  );
}

export function extractEmailsFromRawCvText(text: string): string[] {
  if (!text?.trim()) return [];
  const base = stripBidiAndJoiners(text)
    .replace(/([A-Z0-9._%+-])\s*\r?\n\s*@\s*/gi, "$1@")
    .replace(/@\s*\r?\n\s*([A-Z0-9.-]+\.[A-Z]{2,})/gi, "@$1");
  const collapsed = base.replace(/\s+/g, " ");
  const repairedLine = repairSpacedEmailPatterns(collapsed);
  const blocks = [
    repairedLine,
    repairSpacedEmailPatterns(base),
    collapsed,
    base,
  ];

  const seen = new Set<string>();
  const out: string[] = [];
  const re = /[\w.%+-]+@[\w.-]+\.[a-z]{2,}/gi;

  for (const block of blocks) {
    let m: RegExpExecArray | null;
    const r = new RegExp(re.source, "gi");
    while ((m = r.exec(block)) !== null) {
      let e = m[0].replace(/\s/g, "").toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) continue;
      if (/^(no-?reply|donotreply|noreply|mailer-daemon|postmaster)/i.test(e.split("@")[0] || ""))
        continue;
      if (seen.has(e)) continue;
      seen.add(e);
      out.push(e);
    }
  }
  return out;
}

export function pickPreferredEmail(emails: string[]): string {
  if (!emails.length) return "";
  const filtered = emails.filter((e) => !/example\.(com|org|net)$/i.test(e));
  const list = filtered.length ? filtered : emails;
  const score = (e: string) => {
    const d = e.split("@")[1] || "";
    if (/^(gmail|googlemail)\./i.test(d)) return 5;
    if (/^(outlook|hotmail|live|yahoo|ymail|icloud|proton)/i.test(d)) return 4;
    if (/\.(com|in|co\.in|net|org)$/i.test(d)) return 3;
    return 2;
  };
  return [...list].sort((a, b) => score(b) - score(a))[0] || "";
}

/** Normalize display: Indian mobile as "+91 XXXXX XXXXX" when country code present; else 10-digit block. */
export function extractBestPhoneFromCvText(text: string): string {
  if (!text?.trim()) return "";
  const s = stripBidiAndJoiners(text).replace(/\r/g, "\n");
  const candidates: string[] = [];

  const segments = s.split(/\n|,/);
  for (const seg of segments) {
    const idx = seg.search(/\+91|0091\b|(?:^|[^\d])91\s*[6-9]/i);
    if (idx === -1) continue;
    const slice = seg.slice(Math.max(0, idx));
    const digits = slice.replace(/^\+?91\s*/i, "").replace(/\D/g, "");
    if (digits.length >= 10) {
      const ten = digits.slice(-10);
      if (/^[6-9]\d{9}$/.test(ten)) {
        candidates.push(`+91 ${ten.slice(0, 5)} ${ten.slice(5)}`);
        break;
      }
    }
  }

  let m: RegExpExecArray | null;
  const rPlus = /\+91[^\d]{0,12}([6-9][\d\s.-]{9,18}\d)/g;
  while ((m = rPlus.exec(s)) !== null) {
    const ten = m[1].replace(/\D/g, "").slice(-10);
    if (/^[6-9]\d{9}$/.test(ten)) {
      candidates.push(`+91 ${ten.slice(0, 5)} ${ten.slice(5)}`);
      break;
    }
  }

  const r10 = /\b([6-9]\d{9})\b/g;
  while ((m = r10.exec(s)) !== null) {
    const d = m[1];
    if (d.length === 10) {
      candidates.push(`${d.slice(0, 5)} ${d.slice(5)}`);
      break;
    }
  }

  return candidates[0] || "";
}

export function fillResumeContactFromRawText<T extends { email: string; phone: string }>(
  resume: T,
  content?: string
): T {
  const raw = (content || "").trim();
  if (!raw) return resume;
  const bestEmail = pickPreferredEmail(extractEmailsFromRawCvText(raw));
  const bestPhone = extractBestPhoneFromCvText(raw);
  return {
    ...resume,
    email: (resume.email || "").trim() || bestEmail,
    phone: (resume.phone || "").trim() || bestPhone,
  };
}

/** Last resort user email when CV has no parseable mailbox: prefer phone-derived stable id over random. */
export function deriveImportFallbackEmail(opts: {
  parsedEmail?: string;
  phone?: string;
  nameSlug: string;
}): string {
  const parsed = (opts.parsedEmail || "").trim().toLowerCase();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parsed)) {
    return parsed;
  }
  const digits = String(opts.phone || "").replace(/\D/g, "");
  if (digits.length >= 10) {
    const last10 = digits.slice(-10);
    if (/^[6-9]\d{9}$/.test(last10)) {
      return `candidate.${last10}@phone.cv-import.local`;
    }
  }
  const slug = (opts.nameSlug || "candidate").replace(/[^a-z0-9.]+/gi, ".").replace(/^\.|\.$/g, "") || "candidate";
  return `${slug}.${Date.now()}@placeholder.local`;
}
