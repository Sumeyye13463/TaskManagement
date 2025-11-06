// src/controllers/pm.controller.js
const { pool } = require("../db/pool"); // gerekirse path'i ../pool şeklinde düzelt

const pick = (o, keys) =>
  Object.fromEntries(keys.map(k => [k, o[k]]).filter(([, v]) => v !== undefined));

const asInt = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n)) throw new Error("INVALID_INT");
  return n;
};

exports.listProjects = async (req, res, next) => {
  try {
    const userId = asInt(req.user?.id);
    const q = `
      SELECT p.id, p.name, p.description, p.client_id, p.manager_id,
             p.start_date, p.end_date, p.created_at, p.updated_at
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
  } catch (e) {
    if (e.message === "INVALID_INT") return res.status(400).json({ message: "invalid user id" });
    next(e);
  }
};

exports.createProject = async (req, res, next) => {
  try {
    const managerId = asInt(req.user?.id);
    const body = pick(req.body, ["name", "description", "start_date", "end_date", "client_id"]);
    if (!body.name) return res.status(400).json({ message: "name zorunlu" });

    const vals = [
      body.name,
      body.description ?? null,
      body.start_date ?? null,
      body.end_date ?? null,
      body.client_id ? asInt(body.client_id) : null,
      managerId,
    ];

    const insertQ = `
      INSERT INTO projects (name, description, start_date, end_date, client_id, manager_id, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,NOW(),NOW())
      RETURNING id, name, description, start_date, end_date, client_id, manager_id, created_at, updated_at
    `;
    const { rows } = await pool.query(insertQ, vals);
    const project = rows[0];

    // Manager'ı üyeler tablosuna ekleyelim (idempotent)
    await pool.query(
      `INSERT INTO project_members (project_id, user_id, role, added_at)
       VALUES ($1, $2, 'manager', NOW())
       ON CONFLICT DO NOTHING`,
      [project.id, managerId]
    );

    res.status(201).json(project);
  } catch (e) {
    if (e.message === "INVALID_INT") return res.status(400).json({ message: "invalid input" });
    next(e);
  }
};

exports.getProject = async (req, res, next) => {
  try {
    const id = asInt(req.params.id);
    const { rows } = await pool.query(
      `SELECT id, name, description, start_date, end_date, client_id, manager_id, created_at, updated_at
       FROM projects WHERE id=$1`,
      [id]
    );
    if (!rows[0]) return res.status(404).json({ message: "Project not found" });
    res.json(rows[0]);
  } catch (e) {
    next(e);
  }
};

exports.updateProject = async (req, res, next) => {
  try {
    const id = asInt(req.params.id);
    const body = pick(req.body, ["name", "description", "start_date", "end_date", "client_id", "manager_id"]);
    if (body.client_id !== undefined && body.client_id !== null) body.client_id = asInt(body.client_id);
    if (body.manager_id !== undefined && body.manager_id !== null) body.manager_id = asInt(body.manager_id);

    const fields = Object.keys(body);
    if (!fields.length) return res.status(400).json({ message: "Güncellenecek alan yok" });

    const setSql = fields.map((k, i) => `${k}=$${i + 1}`).join(", ") + ", updated_at=NOW()";
    const vals = fields.map(k => body[k]);
    vals.push(id);

    const { rows } = await pool.query(
      `UPDATE projects SET ${setSql} WHERE id=$${fields.length + 1}
       RETURNING id, name, description, start_date, end_date, client_id, manager_id, created_at, updated_at`,
      vals
    );
    if (!rows[0]) return res.status(404).json({ message: "Project not found" });
    res.json(rows[0]);
  } catch (e) {
    if (e.message === "INVALID_INT") return res.status(400).json({ message: "invalid input" });
    next(e);
  }
};

/* -------- MEMBERS -------- */

exports.listMembers = async (req, res, next) => {
  try {
    const projectId = asInt(req.params.id);
    const q = `
      SELECT m.id, m.user_id, m.role, m.added_at,
             u.username, u.email
      FROM project_members m
      LEFT JOIN users u ON u.id = m.user_id
      WHERE m.project_id = $1
      ORDER BY m.added_at DESC
    `;
    const { rows } = await pool.query(q, [projectId]);
    res.json({ items: rows });
  } catch (e) {
    next(e);
  }
};

exports.addMember = async (req, res, next) => {
  try {
    const projectId = asInt(req.params.id);
    const userId = asInt(req.body.user_id);
    const role = String(req.body.role || "member");

    const { rows } = await pool.query(
      `INSERT INTO project_members (project_id, user_id, role, added_at)
       VALUES ($1,$2,$3,NOW())
       ON CONFLICT (project_id, user_id) DO UPDATE SET role=EXCLUDED.role
       RETURNING id, project_id, user_id, role, added_at`,
      [projectId, userId, role]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    if (e.message === "INVALID_INT") return res.status(400).json({ message: "invalid input" });
    next(e);
  }
};

exports.removeMember = async (req, res, next) => {
  try {
    const projectId = asInt(req.params.id);
    const userId = asInt(req.params.userId);
    const { rowCount } = await pool.query(
      `DELETE FROM project_members WHERE project_id=$1 AND user_id=$2`,
      [projectId, userId]
    );
    if (!rowCount) return res.status(404).json({ message: "Member not found" });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
};
