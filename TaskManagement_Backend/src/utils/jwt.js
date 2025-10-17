const jwt = require('jsonwebtoken');

const ACCESS_TTL  = process.env.ACCESS_TOKEN_TTL  || '15m'; // 15 dakika
const REFRESH_TTL = process.env.REFRESH_TOKEN_TTL || '7d';  // 7 gün

function signAccess(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: ACCESS_TTL });
}

function signRefresh(payload) {
  return jwt.sign(payload, process.env.REFRESH_JWT_SECRET, { expiresIn: REFRESH_TTL });
}

function verifyAccess(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

function verifyRefresh(token) {
  return jwt.verify(token, process.env.REFRESH_JWT_SECRET);
}

module.exports = { signAccess, signRefresh, verifyAccess, verifyRefresh };
