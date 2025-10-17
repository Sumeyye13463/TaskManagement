const { pool } = require('../db/pool');
/* Bir görevin tüm atananları */
async function listAssignees(req, res, next) {
  try {
    const { id } = req.params; // task id
    const { rows } = await pool.query(
      `SELECT ta.user_id, ta.assigned_at, u.username, u.email, u.title
       FROM public.task_assignees ta
       JOIN public.users u ON u.id = ta.user_id
       WHERE ta.task_id = $1
       ORDER BY ta.assigned_at DESC`,
      [id]
    );
    res.json(rows);
  } catch (e) { next(e); }
}

/* Göreve kullanıcı ekle (upsert) */
async function addAssignee(req, res, next) {
  try {
    const { id } = req.params; // task id
    const { user_id } = req.body;
    if (!user_id) return res.status(400).json({ message: 'user_id zorunlu' });

    // var mı kontrolleri
    const t = await pool.query('SELECT 1 FROM public.tasks WHERE id=$1', [id]);
    if (t.rowCount === 0) return res.status(404).json({ message: 'Görev bulunamadı' });

    const u = await pool.query('SELECT 1 FROM public.users WHERE id=$1', [user_id]);
    if (u.rowCount === 0) return res.status(400).json({ message: 'user_id geçersiz' });

    const { rows } = await pool.query(
      `INSERT INTO public.task_assignees (task_id, user_id)
       VALUES ($1,$2)
       ON CONFLICT (task_id, user_id)
       DO UPDATE SET assigned_at = NOW()
       RETURNING task_id, user_id, assigned_at`,
      [id, user_id]
    );
    res.status(201).json(rows[0]);
  } catch (e) { next(e); }
}

/* Görevden kullanıcıyı çıkar */
async function removeAssignee(req, res, next) {
  try {
    const { id, uid } = req.params; // task id, user id
    const r = await pool.query(
      `DELETE FROM public.task_assignees
       WHERE task_id=$1 AND user_id=$2
       RETURNING task_id, user_id`,
      [id, uid]
    );
    if (r.rowCount === 0) return res.status(404).json({ message: 'Kayıt bulunamadı' });
    res.json({ message: 'Atama kaldırıldı', removed: r.rows[0] });
  } catch (e) { next(e); }
}

/* (opsiyonel) Bir kullanıcının atandığı görevleri listele */
async function listTasksByUser(req, res, next) {
  try {
    const { userId } = req.params;
    const { rows } = await pool.query(
      `SELECT t.id, t.project_id, t.title, t.status, t.created_at, t.updated_at
       FROM public.task_assignees ta
       JOIN public.tasks t ON t.id = ta.task_id
       WHERE ta.user_id = $1
       ORDER BY t.updated_at DESC`,
      [userId]
    );
    res.json(rows);
  } catch (e) { next(e); }
}

module.exports = { listAssignees, addAssignee, removeAssignee, listTasksByUser };
