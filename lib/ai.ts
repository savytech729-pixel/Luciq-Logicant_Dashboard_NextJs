import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "@/lib/env";
import { createHash } from "crypto";
import { sendOperationalAlert } from "@/lib/alerts";
import { normalizeCvMimeType } from "@/lib/cv-mime";
import {
  fillResumeContactFromRawText,
  extractBestPhoneFromCvText,
  extractEmailsFromRawCvText,
  pickPreferredEmail,
} from "@/lib/cv-contact";
import { extractProjectsSectionFromCvText } from "@/lib/cv-projects";

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

/** @deprecated Use env.GEMINI_MODEL — kept for bundle consumers */
export const AI_MODELS = {
  get FLASH() {
    return env.GEMINI_MODEL;
  },
  get PRO() {
    return env.GEMINI_MODEL_FALLBACK;
  },
};

type CacheEntry<T> = { value: T; expiresAt: number };
const aiCache = new Map<string, CacheEntry<unknown>>();
let budgetWindow = new Date().toISOString().slice(0, 10);
let dailyCalls = 0;
let cacheHits = 0;
let fallbackCount = 0;
const ESTIMATED_COST_PER_CALL_USD = 0.0002;

function resetDailyBudgetIfNeeded() {
  const today = new Date().toISOString().slice(0, 10);
  if (today !== budgetWindow) {
    budgetWindow = today;
    dailyCalls = 0;
  }
}

function canUseAi() {
  resetDailyBudgetIfNeeded();
  return dailyCalls < Math.max(1, env.AI_DAILY_CALL_LIMIT);
}

function consumeAiBudget() {
  resetDailyBudgetIfNeeded();
  dailyCalls += 1;
}

function getCache<T>(key: string): T | null {
  const hit = aiCache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    aiCache.delete(key);
    return null;
  }
  cacheHits += 1;
  return hit.value as T;
}

function setCache<T>(key: string, value: T) {
  aiCache.set(key, { value, expiresAt: Date.now() + Math.max(1_000, env.AI_CACHE_TTL_MS) });
}

function hashInput(input: unknown) {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

type CacheOptions<T> = { shouldCache?: (value: T) => boolean };

async function runWithBudgetAndCache<T>(
  feature: string,
  payload: unknown,
  run: () => Promise<T | null>,
  fallback: () => T,
  cacheOpts?: CacheOptions<T>
): Promise<T> {
  const key = `${feature}:${hashInput(payload)}`;
  const cached = getCache<T>(key);
  if (cached) return cached;

  if (!canUseAi()) {
    const fallbackValue = fallback();
    fallbackCount += 1;
    if (fallbackCount % 20 === 0) {
      void sendOperationalAlert("AI fallback spike", `Fallback count reached ${fallbackCount} in current runtime window.`);
    }
    if (!cacheOpts?.shouldCache || cacheOpts.shouldCache(fallbackValue)) {
      setCache(key, fallbackValue);
    }
    return fallbackValue;
  }

  consumeAiBudget();
  const value = await run();
  if (value !== null) {
    if (!cacheOpts?.shouldCache || cacheOpts.shouldCache(value)) {
      setCache(key, value);
    }
    return value;
  }
  const fallbackValue = fallback();
  fallbackCount += 1;
  if (fallbackCount % 20 === 0) {
    void sendOperationalAlert("AI fallback spike", `Fallback count reached ${fallbackCount} in current runtime window.`);
  }
  if (!cacheOpts?.shouldCache || cacheOpts.shouldCache(fallbackValue)) {
    setCache(key, fallbackValue);
  }
  return fallbackValue;
}

export function getAiSpendMetrics() {
  resetDailyBudgetIfNeeded();
  const limit = Math.max(1, env.AI_DAILY_CALL_LIMIT);
  const remaining = Math.max(0, limit - dailyCalls);
  const estimatedSpendUsd = Number((dailyCalls * ESTIMATED_COST_PER_CALL_USD).toFixed(6));

  return {
    day: budgetWindow,
    mode: env.AI_BUDGET_MODE,
    dailyCallLimit: limit,
    callsUsed: dailyCalls,
    callsRemaining: remaining,
    cacheHits,
    fallbackCount,
    estimatedCostUsd: estimatedSpendUsd,
    estimatedCostInr: Number((estimatedSpendUsd * 83).toFixed(4)),
  };
}

const DEFAULT_RESUME_PROMPT = `
You are extracting structured data from a resume/CV for an ATS. Read the entire document carefully.

Return ONLY a JSON object with exactly these keys:
{
  "name": string,
  "email": string,
  "phone": string,
  "currentRole": string,
  "totalExperience": string,
  "skills": string[],
  "education": string,
  "summary": string,
  "preferredLocation": string,
  "noticePeriod": string,
  "expectedSalary": string,
  "linkedInUrl": string,
  "languages": string[],
  "certifications": string,
  "employmentHistory": string,
  "projects": string
}

Rules:
- "currentRole" = the candidate's CURRENT or most recent job TITLE only (e.g. "Senior Software Engineer"), not company name.
- "skills" = technical and professional skills as separate strings; include as many as appear (target 8–25). Include tools, frameworks, domains (e.g. React, AWS, Java, Sales, Accounts).
- "totalExperience" = total YEARS of professional experience as a string number (e.g. "10.5"). Infer from dates if totals are stated.
- "education" = highest relevant qualification in one line (degree + field + institution if visible).
- "summary" = 2–4 sentences: background, strengths, domains (for matching jobs).
- "name" = clean human name only; strip filenames, portals (Naukri_), bracket tags like [20y_0m], underscores.
- "email" / "phone" = exactly as on CV (contact header, footer, or beside address). Never skip: scan top-right, top-left, and lines labeled Email/E-mail/M/Mobile/Ph/Tel.
- If contact info sits next to address or in a sidebar, still copy full email and phone character-for-character.
- "preferredLocation" = city/region or "Remote" if clearly stated.
- "noticePeriod" = one of: Immediate, 15 Days, 30 Days, 45 Days, 60 Days, 90 Days, Negotiable — or empty if unknown.
- "expectedSalary" = annual expectation in INR text like "₹18,00,000" or "18 LPA" when stated; else "".
- "linkedInUrl" = full LinkedIn profile URL if visible; else "".
- "languages" = spoken/written languages (e.g. English, Hindi) as separate strings; [] if none.
- "certifications" = professional certifications, licenses, courses (one paragraph or bullet lines); else "".
- "employmentHistory" = past and current roles: for EACH job include Company | Job title | Date range | one line of impact (use newline between jobs); as much as fits; else "".
- "projects" = ALL notable projects and clients. If the CV has a "LIST OF PROJECTS", project table, or portfolio table (including multi-page), copy every project row: project name, type, and role/responsibilities (one line or row per project; use newlines; do not summarize away long lists). For architecture/construction/MEP CVs, this field is often a large table—include it in full (up to ~20k characters). If there is no project section, use "".

Use "" for unknown strings and [] only when absolutely no skills can be inferred.
- If the layout has two columns or software shown as icons with labels, still read all visible text and tool names.
`;

type ParsedResume = {
  name: string;
  email: string;
  phone: string;
  currentRole: string;
  totalExperience: string;
  skills: string[];
  education: string;
  summary: string;
  preferredLocation: string;
  noticePeriod: string;
  expectedSalary: string;
  linkedInUrl: string;
  languages: string[];
  certifications: string;
  employmentHistory: string;
  projects: string;
  parseConfidence?: number;
  parseNeedsReview?: boolean;
  parseIssues?: string[];
  parseSourceFile?: string;
};

function asResumeString(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "number" && !Number.isNaN(v)) return String(v);
  const s = String(v).trim();
  return s === "null" || s === "undefined" ? "" : s;
}

function asResumeSkills(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => asResumeString(x)).filter(Boolean);
  if (typeof v === "string") {
    return v
      .split(/[,;|]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

/** Map alternate JSON keys from models into our ParsedResume shape. */
function coerceAiResumeJson(raw: unknown): Partial<ParsedResume> {
  if (!raw || typeof raw !== "object") return {};
  const o = raw as Record<string, unknown>;
  const first = (...keys: string[]) => {
    for (const k of keys) {
      const v = o[k];
      if (v !== undefined && v !== null && asResumeString(v) !== "") return v;
    }
    return undefined;
  };
  const skillsVal = first("skills", "skill", "technicalSkills", "technical_skills", "coreSkills");
  const langVal = first("languages", "language", "spokenLanguages");
  return {
    name: asResumeString(first("name", "fullName", "full_name", "candidateName", "candidate_name")),
    email: asResumeString(first("email", "emailAddress", "email_id", "mail")),
    phone: asResumeString(first("phone", "phoneNumber", "phone_number", "mobile", "contact", "tel")),
    currentRole: asResumeString(
      first("currentRole", "current_role", "role", "jobTitle", "job_title", "title", "designation")
    ),
    totalExperience: asResumeString(
      first(
        "totalExperience",
        "total_experience",
        "experience",
        "totalYears",
        "total_years",
        "yearsOfExperience",
        "years_of_experience",
        "yoe",
        "experienceYears"
      )
    ),
    skills: asResumeSkills(skillsVal ?? o.skills),
    education: asResumeString(first("education", "qualification", "academics", "degree")),
    summary: asResumeString(first("summary", "profile", "objective", "about", "professionalSummary")),
    preferredLocation: asResumeString(
      first("preferredLocation", "preferred_location", "location", "city", "currentLocation")
    ),
    noticePeriod: asResumeString(first("noticePeriod", "notice_period", "np", "notice")),
    expectedSalary: asResumeString(
      first("expectedSalary", "expected_salary", "salary", "ctc", "expectedCtc")
    ),
    linkedInUrl: asResumeString(
      first("linkedInUrl", "linkedin", "linkedinUrl", "linkedin_url", "linked_in")
    ),
    languages: asResumeSkills(langVal ?? o.languages),
    certifications: asResumeString(first("certifications", "certification", "licenses", "courses")),
    employmentHistory: asResumeString(
      first(
        "employmentHistory",
        "employment_history",
        "workExperience",
        "work_experience",
        "experienceDetails",
        "professionalExperience"
      )
    ),
    projects: asResumeString(
      first(
        "projects",
        "portfolio",
        "keyProjects",
        "listOfProjects",
        "list_of_projects",
        "projectList",
        "project_list",
        "keyProjectDetails",
        "projectDetails"
      )
    ),
  };
}

function toTitleCase(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((part) => {
      const upperSafe = ["AWS", "GCP", "SQL", "API", "UI", "UX", "AI", "ML", "NLP", "ETL"];
      if (upperSafe.includes(part.toUpperCase())) return part.toUpperCase();
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    })
    .join(" ")
    .trim();
}

function deriveNameFromEmail(email: string) {
  const local = (email || "").split("@")[0] || "";
  if (!local) return "";
  const parts = local
    .replace(/[0-9]+/g, " ")
    .split(/[._-]+/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length < 2) return "";
  return toTitleCase(parts.join(" "));
}

function cleanCandidateName(raw: string, fallbackName: string, emailHint?: string) {
  const source = (raw || fallbackName || "")
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\b(naukri|resume|cv|profile|candidate)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  let cleaned = source.replace(/[^a-zA-Z.\s]/g, " ").replace(/\s+/g, " ").trim();
  // OCR often emits HEADER NAMES IN ALL CAPS — normalize without stripping letters
  if (/^[A-Z][A-Z\s.]{2,80}$/.test(source.trim())) {
    cleaned = source.trim().replace(/\s+/g, " ");
  }
  const titled = toTitleCase(cleaned || fallbackName || "Candidate");
  const words = titled.split(" ").filter(Boolean);
  if (words.length >= 2) return titled;
  const emailName = deriveNameFromEmail(emailHint || "");
  if (emailName) return emailName;
  return titled;
}

function normalizeExperience(value: string) {
  const match = (value || "").match(/(\d+(\.\d+)?)/);
  return match ? String(Number(match[1])) : "";
}

function normalizeNoticePeriod(value: string) {
  const v = (value || "").toLowerCase();
  if (!v) return "";
  if (v.includes("immediate") || v.includes("join now")) return "Immediate";
  if (v.includes("15")) return "15 Days";
  if (v.includes("30") || v.includes("1 month")) return "30 Days";
  if (v.includes("60") || v.includes("2 month")) return "60 Days";
  if (v.includes("90") || v.includes("3 month")) return "90 Days";
  return toTitleCase(value);
}

function formatInr(amount: number) {
  const integer = Math.round(amount);
  const text = integer.toString();
  if (text.length <= 3) return `₹${text}`;
  const last3 = text.slice(-3);
  const rest = text.slice(0, -3);
  const grouped = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return `₹${grouped},${last3}`;
}

function normalizeSalary(value: string) {
  const v = (value || "").replace(/,/g, "").trim();
  if (!v) return "";
  if (/^\d+(\.\d+)?$/.test(v)) return formatInr(Number(v));
  const lacMatch = v.toLowerCase().match(/(\d+(\.\d+)?)\s*(l|lac|lakh)/);
  if (lacMatch) return formatInr(Number(lacMatch[1]) * 100000);
  const amountMatch = v.match(/(\d{5,9})/);
  if (amountMatch) return formatInr(Number(amountMatch[1]));
  return value.includes("₹") ? value : `₹${value}`;
}

function normalizeSkills(skills: unknown) {
  const list = Array.isArray(skills) ? skills : typeof skills === "string" ? skills.split(",") : [];
  const seen = new Set<string>();
  const normalized: string[] = [];
  for (const item of list) {
    const token = toTitleCase(String(item).replace(/[^\w+#.\-/\s]/g, " ").trim());
    if (!token) continue;
    const key = token.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    normalized.push(token);
  }
  return normalized.slice(0, 30);
}

function normalizeLanguageList(input: unknown): string[] {
  const list = Array.isArray(input) ? input : typeof input === "string" ? input.split(/[,;|]/) : [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of list) {
    const t = String(item).trim();
    if (!t) continue;
    const k = t.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(t.charAt(0).toUpperCase() + t.slice(1).toLowerCase());
  }
  return out.slice(0, 25);
}

function normalizeLinkedInUrl(raw: string): string {
  let s = String(raw || "").trim();
  if (!s) return "";
  if (!/^https?:\/\//i.test(s)) {
    if (/linkedin\.com/i.test(s)) s = `https://${s.replace(/^\/\//, "").replace(/^\/+/, "")}`;
  }
  return s;
}

function formatEducationLine(raw: string): string {
  const s = String(raw || "").trim();
  if (!s) return "";
  if (s.length > 200) return s;
  return toTitleCase(s);
}

function normalizeLocation(value: string) {
  if (!value) return "";
  const cleaned = value.replace(/[^\w,\-/\s]/g, " ").replace(/\s+/g, " ").trim();
  return cleaned
    .split(/[\/,]/)
    .map((part) => toTitleCase(part.trim()))
    .filter(Boolean)
    .slice(0, 2)
    .join(" / ");
}

function extractSignalsFromText(content?: string) {
  if (!content) return {} as Partial<ParsedResume>;
  const email = pickPreferredEmail(extractEmailsFromRawCvText(content));
  const phone = extractBestPhoneFromCvText(content);
  const exp =
    content.match(/(\d+(\.\d+)?)\s*\+\s*years?/i)?.[1] ||
    content.match(/(\d+(\.\d+)?)\s*(years?|yrs?\.?|y\.?\s*o\.?)/i)?.[1] ||
    content.match(/total[\s:]*(\d+(\.\d+)?)\s*(years|yrs)/i)?.[1] ||
    content.match(/\[(\d+)\s*y/i)?.[1] ||
    content.match(/duration\s*[-–]\s*(\d+)\s*year/i)?.[1] ||
    "";
  const notice = content.match(/(immediate|15\s*days|30\s*days|45\s*days|60\s*days|90\s*days)/i)?.[0] || "";
  const location =
    content.match(
      /\b(bengaluru|bangalore|mumbai|pune|hyderabad|chennai|delhi|noida|gurgaon|gurugram|kolkata|ahmedabad|varanasi|goa|rohtak|remote)\b/i
    )?.[0] || "";
  const salary = content.match(/₹?\s?(\d+(\.\d+)?)\s*(lpa|lakh|lac|lakhs|per annum)/i)?.[0] || "";
  return { email, phone, totalExperience: exp, noticePeriod: notice, preferredLocation: location, expectedSalary: salary };
}

/** Naukri-style filename: Name[8y_0m].pdf or tokens like 8y_0m, 10+years, 12y */
function inferYearsFromFilename(fileName: string): string {
  const patterns = [
    /\[(\d+)y[_\s]/i,
    /(\d+)y_\d+m/i,
    /\[(\d+)\s*y\s*_?\s*\d*m\s*\]/i,
    /(\d+)\s*\+\s*years?/i,
    /[_\s-](\d{1,2})y\b/i,
    /(\d+(?:\.\d+)?)\s*yrs?\b/i,
  ];
  for (const re of patterns) {
    const m = fileName.match(re);
    if (m?.[1]) {
      const n = Number(m[1]);
      if (!Number.isNaN(n) && n >= 0 && n <= 60) return String(n);
    }
  }
  return "";
}

/** Prefer non-empty AI fields; fill gaps from OCR/filename heuristics so sparse JSON cannot wipe usable signals. */
function mergeAiWithHeuristicBaseline(
  aiBest: (ParsedResume & { parseConfidence?: number }) | null,
  baseline: ParsedResume,
  fileName: string
): ParsedResume {
  const b = aiBest;
  return {
    name:
      b?.name?.trim() && !/^candidate$/i.test(b.name)
        ? b.name
        : baseline.name || b?.name || "Candidate",
    email: b?.email?.trim() || baseline.email,
    phone: b?.phone?.trim() || baseline.phone,
    currentRole: b?.currentRole?.trim() || baseline.currentRole,
    totalExperience: b?.totalExperience?.trim() || baseline.totalExperience,
    skills: mergeSkillLists(b?.skills ?? [], baseline.skills ?? []),
    education: b?.education?.trim() || baseline.education,
    summary: b?.summary?.trim() || baseline.summary,
    preferredLocation: b?.preferredLocation?.trim() || baseline.preferredLocation,
    noticePeriod: b?.noticePeriod?.trim() || baseline.noticePeriod,
    expectedSalary: b?.expectedSalary?.trim() || baseline.expectedSalary,
    linkedInUrl: b?.linkedInUrl?.trim() || baseline.linkedInUrl,
    languages: mergeSkillLists(b?.languages ?? [], baseline.languages ?? []).slice(0, 25),
    certifications: b?.certifications?.trim() || baseline.certifications,
    employmentHistory: b?.employmentHistory?.trim() || baseline.employmentHistory,
    projects: preferRicherProjects(b?.projects?.trim() || "", baseline.projects?.trim() || ""),
    parseSourceFile: fileName,
  };
}

const RESUME_KEYWORD_SKILLS: { re: RegExp; label: string }[] = [
  { re: /\brevit\b/i, label: "Autodesk Revit" },
  { re: /\bautocad\b/i, label: "AutoCAD" },
  { re: /\bsketchup\b/i, label: "SketchUp" },
  { re: /\blumion\b/i, label: "Lumion" },
  { re: /\bphotoshop\b|\bphotoshop\s*\(/i, label: "Adobe Photoshop" },
  { re: /\bmicrosoft\s+office\b|\bms\s+office\b/i, label: "Microsoft Office" },
  { re: /\barchicad\b/i, label: "ArchiCAD" },
  { re: /\brhino\s*3d\b|\brhino\b/i, label: "Rhino 3D" },
  { re: /\b3ds\s*max\b|\b3d\s*max\b/i, label: "3ds Max" },
  { re: /\bhvac\b/i, label: "HVAC" },
  { re: /\bstaad\b|\bstaad\.?pro\b/i, label: "STAAD Pro" },
  { re: /\betabs\b/i, label: "ETABS" },
  { re: /\bsafe\b(?!\s+harbor)/i, label: "SAFE" },
  { re: /\breact\.?js\b|\breact\b/i, label: "React" },
  { re: /\bnode\.?js\b|\bnodejs\b/i, label: "Node.js" },
  { re: /\bpython\b/i, label: "Python" },
  { re: /\bjava\b/i, label: "Java" },
  { re: /\baws\b/i, label: "AWS" },
  { re: /\bsql\b/i, label: "SQL" },
  { re: /\bbim\b/i, label: "BIM" },
];

function inferSkillsFromResumeKeywords(text: string): string[] {
  if (!text || text.length < 8) return [];
  const found = new Set<string>();
  for (const { re, label } of RESUME_KEYWORD_SKILLS) {
    if (re.test(text)) found.add(label);
  }
  return [...found].slice(0, 25);
}

function inferRoleFromProfessionalText(text: string): string {
  const block = text.slice(0, 12000);
  const patterns = [
    /\b(Assistant|Associate|Senior|Junior|Lead|Principal|Staff)\s+Architect\b/i,
    /\bArchitect\b/i,
    /\b(Software|Senior|Junior|Lead)\s+(Engineer|Developer)\b/i,
    /\b(Data|Business)\s+Analyst\b/i,
  ];
  for (const p of patterns) {
    const m = block.match(p);
    if (m?.[0]) return m[0].trim();
  }
  return "";
}

function inferEducationSnippet(text: string): string {
  const m =
    text.match(/B\.?\s*ARCH[^\n]*/i)?.[0]?.trim() ||
    text.match(/B\.?\s*Tech[^\n]*/i)?.[0]?.trim() ||
    text.match(/M\.?\s*Tech[^\n]*/i)?.[0]?.trim() ||
    text.match(/MBA[^\n]*/i)?.[0]?.trim();
  return m ? m.slice(0, 220) : "";
}

/** Prefer OCR-recovered project tables when the model returns a stub or omits rows. */
function preferRicherProjects(modelText: string, ocrSection: string): string {
  const a = (modelText || "").trim();
  const h = (ocrSection || "").trim();
  if (!h) return a;
  if (!a) return h;
  if (h.length > Math.max(400, a.length * 2)) return h;
  return a;
}

function mergeSkillLists(primary: string[], extra: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of [...primary, ...extra]) {
    const t = s.trim();
    if (!t) continue;
    const k = t.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(toTitleCase(t.replace(/[^\w+#.\-/\s]/g, " ").trim()));
  }
  return out.slice(0, 30);
}

/** When Gemini/OCR misses fields, recover from raw text + filename heuristics (graphic-heavy CVs). */
function heuristicEnrichResume(
  parsed: ParsedResume,
  content: string | undefined,
  fileName: string,
  fallbackName: string
): ParsedResume {
  const text = content || "";
  const signals = extractSignalsFromText(text);
  const yearsFile = inferYearsFromFilename(fileName);
  const kwSkills = inferSkillsFromResumeKeywords(text);
  const roleGuess = inferRoleFromProfessionalText(text);
  const eduGuess = inferEducationSnippet(text);

  let email = parsed.email || signals.email || "";
  let phone = parsed.phone || signals.phone || "";
  if (phone && !phone.includes("+") && /^\d{10}$/.test(phone.replace(/\s/g, ""))) {
    phone = phone.replace(/\s/g, "");
  }

  let totalExperience =
    parsed.totalExperience ||
    signals.totalExperience ||
    (yearsFile ? yearsFile : "");

  let currentRole = parsed.currentRole?.trim() ? parsed.currentRole : roleGuess;
  let education = parsed.education?.trim() ? parsed.education : eduGuess;
  let summary = parsed.summary?.trim()
    ? parsed.summary
    : text.match(/career\s+statement[^\n]*\n+([^\n]+)/i)?.[1]?.trim() || "";

  const skills = mergeSkillLists(parsed.skills || [], kwSkills);

  let preferredLocation =
    parsed.preferredLocation ||
    signals.preferredLocation ||
    normalizeLocation(signals.preferredLocation || "");

  return normalizeParsedResume(
    {
      ...parsed,
      email,
      phone,
      totalExperience,
      currentRole,
      education,
      summary,
      skills,
      preferredLocation,
      noticePeriod: parsed.noticePeriod || signals.noticePeriod || "",
      expectedSalary: parsed.expectedSalary || signals.expectedSalary || "",
      linkedInUrl: parsed.linkedInUrl,
      languages: parsed.languages,
      certifications: parsed.certifications,
      employmentHistory: parsed.employmentHistory,
      projects: parsed.projects?.trim() || extractProjectsSectionFromCvText(text) || "",
    },
    fallbackName,
    text
  );
}

function isSparseExtraction(resume: ParsedResume): boolean {
  const sk = resume.skills?.length ?? 0;
  const weakEmail = !resume.email?.trim();
  const weakRole = !resume.currentRole?.trim();
  const weakExp = !resume.totalExperience?.trim();
  return weakEmail && sk < 2 && weakRole && weakExp;
}

function normalizeParsedResume(raw: Partial<ParsedResume>, fallbackName: string, content?: string): ParsedResume {
  const textSignals = extractSignalsFromText(content);
  const emailHint = (raw.email || textSignals.email || "").trim().toLowerCase();
  return {
    name: cleanCandidateName(raw.name || "", fallbackName, emailHint),
    email: emailHint,
    phone: (raw.phone || textSignals.phone || "").trim(),
    currentRole: toTitleCase((raw.currentRole || "").trim()),
    totalExperience: normalizeExperience(raw.totalExperience || textSignals.totalExperience || ""),
    skills: normalizeSkills(raw.skills),
    education: formatEducationLine(raw.education || ""),
    summary: (raw.summary || "").trim(),
    preferredLocation: normalizeLocation(raw.preferredLocation || textSignals.preferredLocation || ""),
    noticePeriod: normalizeNoticePeriod(raw.noticePeriod || textSignals.noticePeriod || ""),
    expectedSalary: normalizeSalary(raw.expectedSalary || textSignals.expectedSalary || ""),
    linkedInUrl: normalizeLinkedInUrl(raw.linkedInUrl || ""),
    languages: normalizeLanguageList(raw.languages),
    certifications: String(raw.certifications || "").trim(),
    employmentHistory: String(raw.employmentHistory || "").trim(),
    projects: String(raw.projects || "").trim(),
  };
}

export function evaluateParsedResumeQuality(resume: ParsedResume) {
  const issues: string[] = [];
  let score = 100;

  if (!resume.name || resume.name.length < 3 || /\b(candidate|resume|naukri)\b/i.test(resume.name)) {
    issues.push("Name quality is low");
    score -= 25;
  }
  if (!resume.email) {
    issues.push("Email missing");
    score -= 20;
  }
  if (!resume.currentRole) {
    issues.push("Current role missing");
    score -= 15;
  }
  if (!resume.totalExperience) {
    issues.push("Experience not detected");
    score -= 15;
  }
  if (!resume.skills || resume.skills.length < 3) {
    issues.push("Insufficient skills extracted");
    score -= 15;
  }
  if (!resume.preferredLocation) {
    issues.push("Location missing");
    score -= 5;
  }
  if (!resume.noticePeriod) {
    issues.push("Notice period missing");
    score -= 5;
  }

  const confidence = Math.max(0, Math.min(100, score));
  return {
    parseConfidence: confidence,
    parseNeedsReview: confidence < 75,
    parseIssues: issues,
  };
}

function extractJsonBlock(text: string) {
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("AI response did not contain a valid JSON object");
  }
  return cleaned.slice(start, end + 1);
}

function parseJsonObject(text: string) {
  const block = extractJsonBlock(text);
  try {
    return JSON.parse(block);
  } catch {
    const fixed = block
      .replace(/,\s*}/g, "}")
      .replace(/,\s*]/g, "]")
      .replace(/([{,]\s*)'([^']+)'(\s*:)/g, '$1"$2"$3');
    return JSON.parse(fixed);
  }
}

function parseJsonArray(text: string) {
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("AI response did not contain a valid JSON array");
  }
  return JSON.parse(cleaned.slice(start, end + 1));
}

const MAX_OCR_HINT_CHARS = 100_000;

/** Appended on second pass when the first model returns sparse JSON (graphic / multi-column CVs). */
const RESUME_RECOVERY_EXTRA = `

--- Extra rules for difficult PDFs (multi-column layouts, icon-based software rows, design/architecture portfolios) ---
- Read headers and both columns; contact details are often top-right or beside mailing address.
- You MUST output "email" and "phone" if any mailbox or mobile number appears anywhere (including near "Address", "Location", or icons).
- Put software tools in "skills" (e.g. Revit, AutoCAD, SketchUp, Lumion, Photoshop) when names appear near icons or in a software section.
- If you see "LIST OF PROJECTS" or a project table (Project Title / Type / Responsibilities) that continues on the next page, read through ALL pages and put the full list in the "projects" string (one row per line; do not drop rows because the table is long).
- totalExperience: best total years in the profession (use duration lines like "3 years", "5 Months" if needed; prefer a single total year number as string e.g. "8").
- currentRole: the latest job title (e.g. "Assistant Architect"), not a section banner like "ARCHITECT" alone.
`;

/** When file bytes exist, Gemini should see the document; OCR text is only a hint (fixes weak OCR-only parses). */
function buildResumePromptWithOptionalOcr(ocrText?: string) {
  const trimmed = (ocrText || "").trim();
  if (!trimmed) return DEFAULT_RESUME_PROMPT;
  const slice =
    trimmed.length > MAX_OCR_HINT_CHARS
      ? `${trimmed.slice(0, MAX_OCR_HINT_CHARS)}\n[... OCR text truncated ...]`
      : trimmed;
  return `${DEFAULT_RESUME_PROMPT}

Reference text from Document AI OCR (may be incomplete; prefer the attached file when they conflict):
---
${slice}
---`;
}

function mimeSupportsMultimodalResume(mime: string) {
  const m = mime.toLowerCase();
  return (
    m === "application/pdf" ||
    m.startsWith("image/") ||
    m === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    m === "application/msword"
  );
}

/**
 * Intelligent resume parser: multimodal Gemini + OCR hints + heuristic recovery for graphic-heavy CVs.
 */
export async function parseResume(fileName: string, content?: string, fileData?: { base64: string, mimeType: string }) {
  const fallbackName = fileName.split(".")[0].replace(/_/g, " ").replace(/-/g, " ");
  const fallbackResume: ParsedResume = {
    name: fallbackName,
    email: "",
    phone: "",
    currentRole: "",
    totalExperience: "",
    skills: [],
    education: "",
    summary: "",
    preferredLocation: "",
    noticePeriod: "",
    expectedSalary: "",
    linkedInUrl: "",
    languages: [],
    certifications: "",
    employmentHistory: "",
    projects: "",
    parseSourceFile: fileName,
  };

  return runWithBudgetAndCache(
    "parseResume",
    { fileName, content, fileMime: fileData?.mimeType, fileHash: fileData?.base64?.slice(0, 120) },
    async () => {
      const fd = fileData
        ? { ...fileData, mimeType: normalizeCvMimeType(fileName, fileData.mimeType) }
        : undefined;
      const hasInlineFile = Boolean(fd?.base64 && fd?.mimeType);
      const useMultimodal = Boolean(fd && hasInlineFile && mimeSupportsMultimodalResume(fd.mimeType));

      async function generate(modelName: string, prompt: string) {
        const model = genAI.getGenerativeModel({ model: modelName });
        if (useMultimodal && fd) {
          const result = await model.generateContent([
            prompt,
            {
              inlineData: {
                data: fd.base64,
                mimeType: fd.mimeType,
              },
            },
          ]);
          return (await result.response).text();
        }
        if (content && content.trim().length > 0) {
          const result = await model.generateContent(`${prompt}\n\nResume text:\n${content}`);
          return (await result.response).text();
        }
        if (fd) {
          const result = await model.generateContent([
            prompt,
            {
              inlineData: {
                data: fd.base64,
                mimeType: fd.mimeType,
              },
            },
          ]);
          return (await result.response).text();
        }
        throw new Error("No resume content found for parsing");
      }

      function packResponse(rawText: string) {
        let partial: Partial<ParsedResume> = {};
        try {
          partial = coerceAiResumeJson(parseJsonObject(rawText));
        } catch {
          partial = {};
        }
        const normalized = normalizeParsedResume(partial, fallbackName, content);
        const enriched = heuristicEnrichResume(normalized, content, fileName, fallbackName);
        const contactRich = fillResumeContactFromRawText(enriched, content);
        const quality = evaluateParsedResumeQuality(contactRich);
        return { ...contactRich, ...quality, parseSourceFile: fileName };
      }

      const modelOrder = [
        env.GEMINI_MODEL,
        env.GEMINI_MODEL_FALLBACK,
        "gemini-2.0-flash",
        "gemini-2.5-flash",
        "gemini-1.5-flash-8b",
      ].filter((m, i, a) => Boolean(m) && a.indexOf(m) === i);

      const promptA = buildResumePromptWithOptionalOcr(content);
      const promptB =
        `${DEFAULT_RESUME_PROMPT}${RESUME_RECOVERY_EXTRA}` +
        (content?.trim()
          ? `\n\nReference OCR/text:\n${content.trim().slice(0, MAX_OCR_HINT_CHARS)}`
          : "");

      const attempts: { name: string; prompt: string }[] = [];
      for (const name of modelOrder) {
        attempts.push({ name, prompt: promptA }, { name, prompt: promptB });
      }

      let best: ReturnType<typeof packResponse> | null = null;
      for (let i = 0; i < Math.min(attempts.length, 6); i++) {
        const { name, prompt } = attempts[i];
        try {
          const rawText = await generate(name, prompt);
          const packed = packResponse(rawText);
          if (!best || (packed.parseConfidence ?? 0) > (best.parseConfidence ?? 0)) {
            best = packed;
          }
          if ((packed.parseConfidence ?? 0) >= 78 && !isSparseExtraction(packed as unknown as ParsedResume)) {
            break;
          }
        } catch (err) {
          console.error("AI Resume Parsing Error:", name, err);
        }
      }

      const baseline = heuristicEnrichResume(
        normalizeParsedResume({}, fallbackName, content),
        content,
        fileName,
        fallbackName
      );
      const merged = mergeAiWithHeuristicBaseline(best, baseline, fileName);
      const mergedContact = fillResumeContactFromRawText(merged, content);
      const quality = evaluateParsedResumeQuality(mergedContact);
      return { ...mergedContact, ...quality, parseSourceFile: fileName };
    },
    () => {
      const normalized = heuristicEnrichResume(
        normalizeParsedResume(fallbackResume, fallbackName, content),
        content,
        fileName,
        fallbackName
      );
      const normalizedContact = fillResumeContactFromRawText(normalized, content);
      const quality = evaluateParsedResumeQuality(normalizedContact);
      return { ...normalizedContact, ...quality, parseSourceFile: fileName };
    },
    {
      shouldCache: (v) => Number((v as { parseConfidence?: number }).parseConfidence ?? 0) >= 48,
    }
  );
}

/**
 * Short recruiter-facing bullets from stored candidate fields (no fake job context).
 */
export async function summarizeCandidateProfile(candidate: {
  name?: string;
  currentRole?: string;
  totalExperience?: unknown;
  experienceYears?: unknown;
  skills?: string[];
  education?: string;
  summary?: string;
  preferredLocation?: string;
  expectedSalary?: string;
  noticePeriod?: string;
  phone?: string;
}): Promise<string[]> {
  const skillsArr = Array.isArray(candidate.skills)
    ? candidate.skills.map((s) => String(s).trim()).filter(Boolean)
    : [];

  return runWithBudgetAndCache(
    "summarizeCandidateProfile",
    { name: candidate.name, nSkills: skillsArr.length },
    async () => {
      const model = genAI.getGenerativeModel({ model: AI_MODELS.FLASH });
      const payload = {
        name: candidate.name,
        currentRole: candidate.currentRole,
        totalExperience: candidate.totalExperience ?? candidate.experienceYears,
        skills: skillsArr,
        education: candidate.education,
        summary: candidate.summary,
        preferredLocation: candidate.preferredLocation,
        expectedSalary: candidate.expectedSalary,
        noticePeriod: candidate.noticePeriod,
        phone: candidate.phone ? "(present)" : "",
      };
      const prompt = `From these structured CV fields, write exactly 4 short bullet points for a recruiter (one sentence each).
1) Role & years of experience
2) Top strengths / skills cluster
3) Education & location / mobility
4) One practical next step (e.g. validate salary, notice period)

Fields:
${JSON.stringify(payload, null, 2)}

Return ONLY a JSON array of 4 strings. No markdown.`;
      const result = await model.generateContent(prompt);
      const text = (await result.response).text();
      return parseJsonArray(text) as string[];
    },
    () => {
      const exp =
        candidate.totalExperience ?? candidate.experienceYears ?? "";
      return [
        `${candidate.name || "Candidate"} — ${candidate.currentRole || "Role not captured"} (${exp !== "" ? `${exp} yrs total` : "experience unknown"}).`,
        `Skills: ${skillsArr.slice(0, 12).join(", ") || "None stored yet — re-upload CV or edit profile."}`,
        `Education & mobility: ${candidate.education || "N/A"} · ${candidate.preferredLocation || "location N/A"}.`,
        candidate.summary
          ? `Summary: ${String(candidate.summary).slice(0, 280)}${String(candidate.summary).length > 280 ? "…" : ""}`
          : "Add a summary by re-parsing the CV if fields look empty.",
      ];
    }
  );
}

/**
 * Advanced Match Analysis
 * Compares a candidate profile against a job description
 */
export async function analyzeMatch(candidate: any, job: any) {
  const prompt = `
    Compare this Candidate to the Vacancy using skills overlap, years of experience vs requirement,
    education fit (if the job mentions degrees), current role/title relevance to the job title,
    location/work setting, and salary band if both sides have signals.

    Candidate (use all relevant fields):
    ${JSON.stringify({
      name: candidate.name,
      currentRole: candidate.currentRole,
      totalExperience: candidate.totalExperience ?? candidate.experienceYears,
      skills: candidate.skills,
      education: candidate.education,
      summary: candidate.summary,
      preferredLocation: candidate.preferredLocation,
      noticePeriod: candidate.noticePeriod,
      expectedSalary: candidate.expectedSalary,
      workSettingPreference: candidate.workSettingPreference,
    })}

    Vacancy:
    ${JSON.stringify({
      title: job.title,
      description: job.description,
      requiredSkills: job.requiredSkills,
      experienceRequired: job.experienceRequired,
      location: job.location,
      workSetting: job.workSetting,
      salaryRange: job.salaryRange,
      noticePeriod: job.noticePeriod,
    })}
    
    Return ONLY a JSON object:
    {
      "score": number (0-100),
      "reasoning": "Short 2 sentence explanation of the match",
      "breakdown": {
        "skills": number (0-100),
        "experience": number (0-100),
        "location": number (0-100),
        "salary": number (0-100)
      },
      "strengths": ["Strength 1", "Strength 2"],
      "gaps": ["Gap 1", "Gap 2"]
    }
  `;

  return runWithBudgetAndCache(
    "analyzeMatch",
    { candidate, job, mode: env.AI_BUDGET_MODE },
    async () => {
      const model = genAI.getGenerativeModel({ model: AI_MODELS.FLASH });
      try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        return parseJsonObject(text);
      } catch (err) {
        console.error("AI Match Error:", err);
        return null;
      }
    },
    () => ({
      score: 60,
      reasoning: "Rule-based fallback used due to budget or AI failure.",
      breakdown: { skills: 60, experience: 60, location: 60, salary: 60 },
      strengths: ["Profile has baseline alignment with role requirements."],
      gaps: ["Detailed AI explanation unavailable in low-cost mode."],
    })
  );
}

/**
 * Personalized Outreach Generator
 */
export async function generateOutreachMessage(candidate: any, job: any, channel: 'email' | 'whatsapp') {
  const prompt = `
    Generate a professional and highly engaging ${channel} invitation message from a recruiter to a candidate.
    
    Recruiter Name: Admin at Talent Platform
    Candidate Name: ${candidate.name}
    Job Title: ${job.title}
    
    Context: The AI matched this candidate with a high score because of their expertise in ${candidate.skills}.
    
    Return ONLY a JSON object:
    {
      "title": "Subject line (if email) or Header",
      "message": "The full message body",
      "actionUrl": "The link for them to apply/accept"
    }
  `;

  return runWithBudgetAndCache(
    "generateOutreachMessage",
    { candidate, job, channel, mode: env.AI_BUDGET_MODE },
    async () => {
      const model = genAI.getGenerativeModel({ model: AI_MODELS.FLASH });
      try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        return parseJsonObject(text);
      } catch (err) {
        console.error("AI Outreach Error:", err);
        return null;
      }
    },
    () => ({
      title: `Invitation for ${job?.title || "this role"}`,
      message: `Hi ${candidate?.name || "there"}, we reviewed your profile and would like to move forward for ${job?.title || "the role"}.`,
      actionUrl: "",
    })
  );
}

/**
 * AI Pre-screening Evaluator
 */
export async function evaluateScreening(answers: { question: string, answer: string }[], job: any) {
  const prompt = `
    Evaluate the following pre-screening interview for the position: ${job.title}.
    
    Interview History:
    ${answers.map(a => `Q: ${a.question}\nA: ${a.answer}`).join('\n\n')}
    
    Compare these answers against the job requirements and context.
    
    Return ONLY a JSON object:
    {
      "score": number (0-100),
      "summary": "1-sentence executive summary of the candidate's responses",
      "verdict": "RECOMMENDED" | "MAYBE" | "NOT_RECOMMENDED",
      "keyInsights": ["Insight 1", "Insight 2"],
      "aiUsageScore": number (0-100),
      "isAI": boolean
    }

    The 'aiUsageScore' represents the likelihood (0-100) that these answers were written by an AI like ChatGPT (unnatural structure, robotic phrasing, too perfect).
  `;

  return runWithBudgetAndCache(
    "evaluateScreening",
    { answers, job, mode: env.AI_BUDGET_MODE },
    async () => {
      const model = genAI.getGenerativeModel({ model: AI_MODELS.FLASH });
      try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        const parsed = parseJsonObject(text);
        return {
          ...parsed,
          aiUsageScore: parsed.aiUsageScore || 0,
          isAI: parsed.isAI || (parsed.aiUsageScore > 75)
        };
      } catch (err) {
        console.error("AI Screening Evaluation Error:", err);
        return null;
      }
    },
    () => ({
      score: 50,
      summary: "Fallback evaluation applied in low-cost mode.",
      verdict: "MAYBE",
      keyInsights: ["Manual review recommended."],
      aiUsageScore: 0,
      isAI: false,
    })
  );
}

/**
 * AI Question Generator for Jobs
 */
export async function generateScreeningQuestions(job: any) {
  const prompt = `
    You are an expert technical recruiter. Generate 3 highly specific, practical interview questions for the job role: "${job.title}".
    
    JOB REQUIREMENTS & CONTEXT:
    ${job.description}
    
    KEY SKILLS REQUIRED: 
    ${Array.isArray(job.requiredSkills) ? job.requiredSkills.join(", ") : job.requiredSkills}
    
    OBJECTIVE:
    Create questions that specifically test the candidate's proficiency in the required skills and their understanding of the job role's unique challenges. Avoid generic questions. Focus on practical scenarios or technical depth related to the ${job.title} role.
    
    Return ONLY a JSON array of 3 strings:
    ["Specific Question 1", "Specific Question 2", "Specific Question 3"]
  `;

  return runWithBudgetAndCache(
    "generateScreeningQuestions",
    { job, mode: env.AI_BUDGET_MODE },
    async () => {
      const model = genAI.getGenerativeModel({ model: AI_MODELS.FLASH });
      try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        return parseJsonArray(text);
      } catch (err) {
        console.error("AI Question Generation Error:", err);
        return null;
      }
    },
    () => [
      "Tell us about your experience in a similar role.",
      "What is your biggest technical challenge so far?",
      "Why do you want to join our team?",
    ]
  );
}


