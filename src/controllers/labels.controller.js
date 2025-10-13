const { pool } = require('../db/pool');

/* LIST */
async function listLabels(req, res, next) {
  try {
    const { project_id } = req.query;
    const params = [];
    const where = project_id ? (params.push(Number(project_id)), `WHERE project_id = $1`) : '';
    const { rows } = await pool.query(
      `SELECT id, project_id, name, color_hex, created_at
       FROM public.labels
       ${where}
       ORDER BY id DESC`,
      params
    );
    res.json(rows);
  } catch (e) { next(e); }
}

/* GET ONE */
async function getLabel(req, res, next) {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      `SELECT id, project_id, name, color_hex, created_at
       FROM public.labels WHERE id=$1`,
      [id]
    );
    if (!rows[0]) return res.status(404).json({ message: 'Etiket bulunamadı' });
    res.json(rows[0]);
  } catch (e) { next(e); }
}

/* CREATE */
async function createLabel(req, res, next) {
  try {
    let { project_id, name, color_hex } = req.body;
    if (!name) return res.status(400).json({ message: 'name zorunlu' });
    const pId = project_id == null || project_id === '' ? null : Number(project_id);
    if (!pId) return res.status(400).json({ message: 'project_id zorunlu' });

    // proje var mı?
    const p = await pool.query('SELECT 1 FROM public.projects WHERE id=$1', [pId]);
    if (p.rowCount === 0) return res.status(400).json({ message: 'project_id geçersiz' });

    const { rows } = await pool.query(
      `INSERT INTO public.labels (project_id, name, color_hex)
       VALUES ($1,$2,$3)
       RETURNING id, project_id, name, color_hex, created_at`,
      [pId, name, color_hex || null]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ message: 'Bu projede aynı isimde etiket var' });
    next(e);
  }
}

/* UPDATE */
async function updateLabel(req, res, next) {
  try {
    const { id } = req.params;
    const { name, color_hex } = req.body;

    const { rows } = await pool.query(
      `UPDATE public.labels
       SET name = COALESCE($1, name),
           color_hex = COALESCE($2, color_hex)
       WHERE id=$3
       RETURNING id, project_id, name, color_hex`,
      [name || null, color_hex || null, id]
    );
    if (!rows[0]) return res.status(404).json({ message: 'Etiket bulunamadı' });
    res.json(rows[0]);
  } catch (e) { next(e); }
}

/* DELETE */
async function deleteLabel(req, res, next) {
  try {
    const { id } = req.params;
    const r = await pool.query(
      `DELETE FROM public.labels WHERE id=$1 RETURNING id, name`, [id]
    );
    if (r.rowCount === 0) return res.status(404).json({ message: 'Etiket bulunamadı' });
    res.json({ message: 'Etiket silindi', label: r.rows[0] });
  } catch (e) { next(e); }
}

module.exports = { listLabels, getLabel, createLabel, updateLabel, deleteLabel };
