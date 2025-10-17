// auth.middleware.js
const jwt = require('jsonwebtoken');
const { pool } = require('../db/pool'); // sende neredeyse onu kullan

// JWT kontrolü (mevcut kodun varsa onu kullan)
exports.authGuard = (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.replace(/^Bearer\s+/i, '');
    if (!token) return res.status(401).json({ message: 'Token gerekli' });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { sub: payload.sub, role: payload.role || 'member' };
    next();
  } catch (e) {
    return res.status(401).json({ message: 'Geçersiz veya süresi dolmuş token.' });
  }
};

// ✅ DİZİ destekli requireRole
exports.requireRole = (allowed) => {
  const allow = Array.isArray(allowed) ? allowed : [allowed].filter(Boolean);
  return (req, res, next) => {
    const userRole = req.user?.role || 'member';
    // Admin her şeyi yapar
    if (userRole === 'admin') return next();
    if (allow.length === 0 || allow.includes(userRole)) return next();
    return res.status(403).json({ message: 'Bu işlem için yetkiniz yok.' });
  };
};

// ✅ Proje üyeliği/rolü kontrolü
// allowedProjectRoles boşsa: "üye olmak yeterli"
// değilse: belirtilen rollerden biri olmak gerekir.
// Ayrıca projects.manager_id == user_id ise geçer.
// Admin global bypass.
exports.requireProjectMember = (allowedProjectRoles = []) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.sub;
      const globalRole = req.user?.role || 'member';
      if (globalRole === 'admin') return next();

      // project_id’yi istekteki veriden bul
      let projectId =
        req.body?.project_id ||
        req.params?.project_id ||
        null;

      // Task güncelle/sil durumunda :id’den proje bul
      if (!projectId && req.params?.id) {
        const t = await pool.query(
          'SELECT project_id FROM public.tasks WHERE id=$1',
          [req.params.id]
        );
        if (t.rowCount > 0) projectId = t.rows[0].project_id;
      }

      if (!projectId) {
        return res.status(400).json({ message: 'project_id gerekli.' });
      }

      // Proje yöneticisi ise (projects.manager_id) yetkili say
      const proj = await pool.query(
        'SELECT manager_id FROM public.projects WHERE id=$1',
        [projectId]
      );
      if (proj.rowCount === 0) {
        return res.status(404).json({ message: 'Proje bulunamadı.' });
      }
      if (proj.rows[0].manager_id === userId) return next();

      // Üyelik/rol kontrolü
      if (allowedProjectRoles.length === 0) {
        const m = await pool.query(
          'SELECT 1 FROM public.project_members WHERE project_id=$1 AND user_id=$2',
          [projectId, userId]
        );
        if (m.rowCount > 0) return next();
      } else {
        const m = await pool.query(
          `SELECT role FROM public.project_members
           WHERE project_id=$1 AND user_id=$2`,
          [projectId, userId]
        );
        if (m.rowCount > 0 && allowedProjectRoles.includes(m.rows[0].role)) {
          return next();
        }
      }

      return res.status(403).json({ message: 'Proje için yetkiniz yok.' });
    } catch (e) {
      next(e);
    }
  };
};
