// src/middlewares/requireRole.js
module.exports = (...roles) => (req, res, next) => {
  // auth middleware kullanıcıyı req.user içine koymalı (JWT’den)
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  const role = (req.user.role || '').toLowerCase();
  if (!roles.map(r => r.toLowerCase()).includes(role)) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  next();
};
