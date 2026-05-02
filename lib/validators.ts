const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function isValidEmail(value: unknown) {
  if (!isNonEmptyString(value)) return false;
  return EMAIL_REGEX.test(value.trim().toLowerCase());
}

export function asTrimmedString(value: unknown) {
  if (!isNonEmptyString(value)) return "";
  return value.trim();
}

export function isObjectIdLike(value: unknown) {
  return typeof value === "string" && /^[a-fA-F0-9]{24}$/.test(value);
}
