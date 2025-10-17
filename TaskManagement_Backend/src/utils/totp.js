// src/utils/totp.js
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");

const ISSUER = "DailyWish"; // ürün adınız

async function generateMfaSecret(labelEmail) {
  const secret = speakeasy.generateSecret({
    length: 20,
    name: `${ISSUER} (${labelEmail})`,
    issuer: ISSUER,
  });
  const otpauthUrl = secret.otpauth_url;
  const qrDataUrl = await QRCode.toDataURL(otpauthUrl);

  return {
    base32: secret.base32,
    otpauthUrl,
    qrDataUrl, // frontend'e img src olarak verebilirsin
  };
}

function verifyToken({ secretBase32, token }) {
  return speakeasy.totp.verify({
    secret: secretBase32,
    encoding: "base32",
    token,
    window: 1, // +/- 30sn tolerans
  });
}

module.exports = { generateMfaSecret, verifyToken };
