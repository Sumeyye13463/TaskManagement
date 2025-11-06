const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

exports.signAccessToken = (user) => {
  return jwt.sign(
    { sub: user.id, role: user.role || "member" },
    JWT_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_TTL || "12h" }
  );
};
exports.verifyToken = (token) => jwt.verify(token, JWT_SECRET);
