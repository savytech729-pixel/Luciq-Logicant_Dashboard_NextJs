import crypto from "crypto";

export function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function hashOtp(otp: string) {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

export function isOtpExpired(expiresAt: Date) {
  return expiresAt.getTime() < Date.now();
}
