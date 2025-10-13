const { pool } = require('../db/pool');
/* -------- LIST --------
   Desteklenen query parametreleri:
   - project_id (gerekli sayılır)
   - status (opsiyonel)
*/
async function listTasks(req, res, next) {
  try {
    const { project_id, status } = req.query;
    const conds = [], params = [];

    if (project_id) { params.push(Number(project_id)); conds.push(`t.project_id = $${params.length}`); }
    if (status)     { params.push(String(status));     conds.push(`t.status = $${params.length}`); }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const { rows } = await pool.query(
      `SELECT t.id, t.project_id, t.title, t.description, t.status,
              t.created_by, t.created_at, t.updated_at, t.estimate_min
       FROM public.tasks t
       ${where}
       ORDER BY t.id DESC`,
      params
    );
    res.json(rows);
  } catch (e) { next(e); }
}

/* -------- GET ONE -------- */
async function getTask(req, res, next) {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      `SELECT t.id, t.project_id, t.title, t.description, t.status,
              t.created_by, t.created_at, t.updated_at, t.estimate_min
       FROM public.tasks t
       WHERE t.id=$1`,
      [id]
    );
    if (!rows[0]) return res.status(404).json({ message: 'Görev bulunamadı' });
    res.json(rows[0]);
  } catch (e) { next(e); }
}

/* -------- CREATE -------- */
async function createTask(req, res, next) {
  try {
    let { project_id, title, description, status, created_by, estimate_min } = req.body;
    if (!project_id) return res.status(400).json({ message: 'project_id zorunlu' });
    if (!title)      return res.status(400).json({ message: 'title zorunlu' });

    const pId = Number(project_id);
    const creator = created_by == null || created_by === '' ? null : Number(created_by);

    // proje var mı?
    const p = await pool.query('SELECT 1 FROM public.projects WHERE id=$1', [pId]);
    if (p.rowCount === 0) return res.status(400).json({ message: 'project_id geçersiz' });

    // created_by varsa kontrol et
    if (creator !== null) {
      const u = await pool.query('SELECT 1 FROM public.users WHERE id=$1', [creator]);
      if (u.rowCount === 0) return res.status(400).json({ message: 'created_by geçersiz' });
    }

    const { rows } = await pool.query(
      `INSERT INTO public.tasks
       (project_id, title, description, status, created_by, estimate_min)
       VALUES ($1,$2,$3,COALESCE($4,'todo'),$5,$6)
       RETURNING id, project_id, title, description, status, created_by, estimate_min, created_at`,
      [pId, title, description || null, status || null, creator, estimate_min || null]
    );
    res.status(201).json(rows[0]);
  } catch (e) { next(e); }
}

/* -------- UPDATE -------- */
async function updateTask(req, res, next) {
  try {
    const { id } = req.params;
    const { title, description, status, estimate_min } = req.body;

    const { rows } = await pool.query(
      `UPDATE public.tasks
       SET title       = COALESCE($1, title),
           description = COALESCE($2, description),
           status      = COALESCE($3, status),
           estimate_min= COALESCE($4, estimate_min),
           updated_at  = NOW()
       WHERE id=$5
       RETURNING id, project_id, title, description, status, created_by, estimate_min, updated_at`,
      [title || null, description || null, status || null, estimate_min || null, id]
    );
    if (!rows[0]) return res.status(404).json({ message: 'Görev bulunamadı' });
    res.json(rows[0]);
  } catch (e) { next(e); }
}

/* -------- DELETE -------- */
async function deleteTask(req, res, next) {
  try {
    const { id } = req.params;
    const r = await pool.query(
      `DELETE FROM public.tasks WHERE id=$1 RETURNING id, title`,
      [id]
    );
    if (r.rowCount === 0) return res.status(404).json({ message: 'Görev bulunamadı' });
    res.json({ message: 'Görev silindi', task: r.rows[0] });
  } catch (e) { next(e); }
}

module.exports = { listTasks, getTask, createTask, updateTask, deleteTask };
