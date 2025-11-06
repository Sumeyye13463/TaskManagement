// src/middlewares/requireRole.js
module.exports = function requireRole(...rolesOrArray) {
  const roles = Array.isArray(rolesOrArray[0]) ? rolesOrArray[0] : rolesOrArray;

  return function roleGuard(req, res, next) {
    // auth.middleware req.user'ı set etmiş olmalı
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
};
