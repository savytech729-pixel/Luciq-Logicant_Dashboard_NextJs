import { describe, expect, it } from "vitest";
import { checkRateLimit } from "@/lib/rate-limit";
import { asTrimmedString, isObjectIdLike, isValidEmail } from "@/lib/validators";
import {
  extractBestPhoneFromCvText,
  extractEmailsFromRawCvText,
  pickPreferredEmail,
  deriveImportFallbackEmail,
} from "@/lib/cv-contact";
import { extractProjectsSectionFromCvText } from "@/lib/cv-projects";

describe("core input validation", () => {
  it("validates email and object id formats", () => {
    expect(isValidEmail("candidate@example.com")).toBe(true);
    expect(isValidEmail("bad-email")).toBe(false);
    expect(isObjectIdLike("507f1f77bcf86cd799439011")).toBe(true);
    expect(isObjectIdLike("not-an-object-id")).toBe(false);
  });

  it("normalizes user input safely", () => {
    expect(asTrimmedString("  hello  ")).toBe("hello");
    expect(asTrimmedString("")).toBe("");
    expect(asTrimmedString(undefined)).toBe("");
  });
});

describe("cv contact extraction", () => {
  it("finds emails with OCR spacing and picks gmail over generic", () => {
    const noisy =
      "Contact\njohn.doe @ gmail . com\nalso support@company.co.in";
    const emails = extractEmailsFromRawCvText(noisy);
    expect(emails.some((e) => e.includes("john") && e.includes("gmail"))).toBe(true);
    expect(pickPreferredEmail(emails)).toContain("gmail.com");
  });

  it("extracts Indian mobile numbers", () => {
    expect(extractBestPhoneFromCvText("Call +91 98765 43210")).toContain("98765");
    expect(extractBestPhoneFromCvText("Ph: 9876543210")).toBeTruthy();
  });

  it("extracts LIST OF PROJECTS blocks from OCR-style text", () => {
    const cv = `
Some header text
LIST OF PROJECTS
Project Title x
BPCL PETROL PUMP Commercial Work
RG Mall Commercial Work

EDUCATION
B.Arch
`;
    const block = extractProjectsSectionFromCvText(cv);
    expect(block).toContain("BPCL");
    expect(block).toContain("RG Mall");
    expect(block.toUpperCase()).not.toContain("EDUCATION");
  });

  it("finds project table by column headers when section title is missing", () => {
    const cv = `
Project Title Project Type Responsibilities
AL Kheesa Villa Compound Doha Villa Compound MEP coord
Khartoum Airport Airport Project Internal
WORK EXPERIENCE
2010-2015 Company A
`;
    const block = extractProjectsSectionFromCvText(cv);
    expect(block).toContain("Khartoum");
    expect(block.toUpperCase()).not.toContain("WORK EXPERIENCE");
  });

  it("prefers real parsed email over phone placeholder", () => {
    expect(
      deriveImportFallbackEmail({
        parsedEmail: "real@example.com",
        phone: "9876543210",
        nameSlug: "x",
      })
    ).toBe("real@example.com");
    expect(
      deriveImportFallbackEmail({ parsedEmail: "", phone: "", nameSlug: "a" })
    ).toContain("@placeholder.local");
  });
});

describe("core rate limiting", () => {
  it("blocks requests once limit is reached", () => {
    const key = "test-smoke-rate-limit";
    expect(checkRateLimit({ key, limit: 2, windowMs: 5_000 }).allowed).toBe(true);
    expect(checkRateLimit({ key, limit: 2, windowMs: 5_000 }).allowed).toBe(true);
    expect(checkRateLimit({ key, limit: 2, windowMs: 5_000 }).allowed).toBe(false);
  });
});
