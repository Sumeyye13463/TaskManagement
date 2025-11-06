// src/services/mfa.js
const speakeasy = require("speakeasy");
const qrcode = require("qrcode");

// MFA QR kodu üretme fonksiyonu
async function generateMfaSecret(email) {
  const secret = speakeasy.generateSecret({
    name: `Task Management (${email})`,
  });

  // QR kodunu base64 formatında döndür
  const qrDataUrl = await qrcode.toDataURL(secret.otpauth_url);

  return {
    base32: secret.base32,
    otpauthUrl: secret.otpauth_url,
    qrDataUrl,
  };
}

module.exports = { generateMfaSecret };
