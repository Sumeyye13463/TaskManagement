const { pool } = require('../db/pool');

/* Bir görevin etiketlerini listele */
async function listLabelsForTask(req, res, next) {
  try {
    const { id } = req.params; // task id
    const { rows } = await pool.query(
      `SELECT tl.label_id, l.name, l.color_hex
       FROM public.task_labels tl
       JOIN public.labels l ON l.id = tl.label_id
       WHERE tl.task_id = $1
       ORDER BY l.name ASC`,
      [id]
    );
    res.json(rows);
  } catch (e) { next(e); }
}

/* Göreve etiket ekle */
async function addLabelToTask(req, res, next) {
  try {
    const { id } = req.params;   // task id
    const { label_id } = req.body;
    if (!label_id) return res.status(400).json({ message: 'label_id zorunlu' });

    // task ve label kontrolü
    const t = await pool.query('SELECT 1 FROM public.tasks WHERE id=$1', [id]);
    if (t.rowCount === 0) return res.status(404).json({ message: 'Görev bulunamadı' });

    const l = await pool.query('SELECT 1 FROM public.labels WHERE id=$1', [label_id]);
    if (l.rowCount === 0) return res.status(400).json({ message: 'label_id geçersiz' });

    const { rows } = await pool.query(
      `INSERT INTO public.task_labels (task_id, label_id)
       VALUES ($1, $2)
       ON CONFLICT (task_id, label_id)
       DO NOTHING
       RETURNING task_id, label_id`,
      [id, label_id]
    );

    if (rows.length === 0)
      return res.status(200).json({ message: 'Etiket zaten bu göreve eklenmiş' });

    res.status(201).json(rows[0]);
  } catch (e) { next(e); }
}

/* Görevden etiketi kaldır */
async function removeLabelFromTask(req, res, next) {
  try {
    const { id, lid } = req.params; // task id, label id
    const r = await pool.query(
      `DELETE FROM public.task_labels
       WHERE task_id=$1 AND label_id=$2
       RETURNING task_id, label_id`,
      [id, lid]
    );
    if (r.rowCount === 0) return res.status(404).json({ message: 'Kayıt bulunamadı' });
    res.json({ message: 'Etiket kaldırıldı', removed: r.rows[0] });
  } catch (e) { next(e); }
}

/* (opsiyonel) Bir etiketin bağlı olduğu görevleri listele */
async function listTasksByLabel(req, res, next) {
  try {
    const { labelId } = req.params;
    const { rows } = await pool.query(
      `SELECT t.id, t.title, t.status, t.created_at, t.updated_at
       FROM public.task_labels tl
       JOIN public.tasks t ON t.id = tl.task_id
       WHERE tl.label_id = $1
       ORDER BY t.updated_at DESC`,
      [labelId]
    );
    res.json(rows);
  } catch (e) { next(e); }
}

module.exports = {
  listLabelsForTask,
  addLabelToTask,
  removeLabelFromTask,
  listTasksByLabel
};
