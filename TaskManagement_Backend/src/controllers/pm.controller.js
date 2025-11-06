// src/controllers/pm.controller.js
const { pool } = require('../db/pool');

const pick = (o, keys) => Object.fromEntries(keys.map(k => [k, o[k]]).filter(([,v]) => v !== undefined));

module.exports = {
  // Kullanıcının yönettiği (manager_id) veya üyesi olduğu projeler
  async listProjects(req, res, next) {
    try {
      // JWT'den gelen id string olabilir; bigint sütunları için int'e çeviriyoruz.
      const userId = Number(req.user.id);
      if (!Number.isFinite(userId)) return res.status(400).json({message:'invalid user id'});

      const q = `
        SELECT p.id, p.name, p.client_id, p.manager_id, p.start_date, p.end_date,
               p.description, p.created_at, p.updated_at
        FROM projects p
        WHERE p.manager_id = $1
           OR EXISTS (
              SELECT 1 FROM project_members m
               WHERE m.project_id = p.id AND m.user_id = $1
           )
        ORDER BY p.updated_at DESC NULLS LAST, p.created_at DESC
        LIMIT 200
      `;
      const { rows } = await pool.query(q, [userId]);
      res.json({ items: rows });
    } catch (e) { next(e); }
  },

  // name (zorunlu), description (ops), start_date/end_date (ops), client_id (ops)
  async createProject(req, res, next) {
    try {
      const managerId = Number(req.user.id);
      const body = pick(req.body, ['name','description','start_date','end_date','client_id']);
      if (!body.name) return res.status(400).json({ message: 'name zorunlu' });

      const q = `
        INSERT INTO projects (name, description, start_date, end_date, client_id, manager_id, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        RETURNING id, name, client_id, manager_id, start_date, end_date, description, created_at, updated_at
      `;
      const vals = [
        body.name,
        body.description ?? null,
        body.start_date ?? null,
        body.end_date ?? null,
        body.client_id ?? null,
        managerId
      ];
      const { rows } = await pool.query(q, vals);

      // İsteğe bağlı: manager'ı project_members tablosuna 'manager' rolüyle eklemek
      await pool.query(
        `INSERT INTO project_members (project_id, user_id, role, added_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT DO NOTHING`,
        [rows[0].id, managerId, 'manager']
      );

      res.status(201).json(rows[0]);
    } catch (e) { next(e); }
  },

  async getProject(req, res, next) {
    try {
      const { id } = req.params;
      const { rows } = await pool.query(
        `SELECT id, name, client_id, manager_id, start_date, end_date, description, created_at, updated_at
           FROM projects WHERE id=$1`,
        [Number(id)]
      );
      if (!rows[0]) return res.status(404).json({ message: 'Project not found' });
      res.json(rows[0]);
    } catch (e) { next(e); }
  },

  async updateProject(req, res, next) {
    try {
      const { id } = req.params;
      const body = pick(req.body, ['name','description','start_date','end_date','client_id','manager_id']);
      const fields = Object.keys(body);
      if (!fields.length) return res.status(400).json({ message: 'Güncellenecek alan yok' });

      const setSql = fields.map((k,i)=>`${k}=$${i+1}`).join(', ') + ', updated_at=NOW()';
      const vals = fields.map(k => body[k]);
      vals.push(Number(id));

      const { rows } = await pool.query(
        `UPDATE projects SET ${setSql} WHERE id=$${fields.length+1}
         RETURNING id, name, client_id, manager_id, start_date, end_date, description, created_at, updated_at`,
        vals
      );
      if (!rows[0]) return res.status(404).json({ message: 'Project not found' });
      res.json(rows[0]);
    } catch (e) { next(e); }
  },

  // status alanı yok; "archive" yerine şimdilik sadece silme YOK. İstersen soft delete için ayrı sütun ekleriz.
  async archiveProject(req, res, next) {
    try {
      return res.status(400).json({ message: 'Archive özelliği şemada yok (status kolonu bulunmuyor).' });
    } catch (e) { next(e); }
  },
};
