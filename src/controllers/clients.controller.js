const { pool } = require('../db/pool');

/* ---------------------- TÜM MÜŞTERİLER ---------------------- */
async function listClients(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, contact_name, contact_email, created_at, updated_at
       FROM public.clients
       ORDER BY id DESC`
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
}

/* ---------------------- TEK MÜŞTERİ ---------------------- */
async function getClient(req, res, next) {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      `SELECT id, name, contact_name, contact_email, created_at, updated_at
       FROM public.clients WHERE id=$1`,
      [id]
    );
    if (!rows[0]) return res.status(404).json({ message: 'Müşteri bulunamadı' });
    res.json(rows[0]);
  } catch (e) {
    next(e);
  }
}

/* ---------------------- MÜŞTERİ OLUŞTUR ---------------------- */
async function createClient(req, res, next) {
  try {
    const { name, contact_name, contact_email } = req.body;
    if (!name) return res.status(400).json({ message: 'name zorunlu' });

    const { rows } = await pool.query(
      `INSERT INTO public.clients (name, contact_name, contact_email)
       VALUES ($1, $2, $3)
       RETURNING id, name, contact_name, contact_email, created_at`,
      [name, contact_name || null, contact_email || null]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    if (e.code === '23505')
      return res.status(409).json({ message: 'Bu müşteri zaten var' });
    next(e);
  }
}

/* ---------------------- MÜŞTERİ GÜNCELLE ---------------------- */
async function updateClient(req, res, next) {
  try {
    const { id } = req.params;
    const { name, contact_name, contact_email } = req.body;

    const { rows } = await pool.query(
      `UPDATE public.clients
       SET name = COALESCE($1, name),
           contact_name = COALESCE($2, contact_name),
           contact_email = COALESCE($3, contact_email),
           updated_at = NOW()
       WHERE id=$4
       RETURNING id, name, contact_name, contact_email, updated_at`,
      [name || null, contact_name || null, contact_email || null, id]
    );
    if (!rows[0]) return res.status(404).json({ message: 'Müşteri bulunamadı' });
    res.json(rows[0]);
  } catch (e) {
    next(e);
  }
}

/* ---------------------- MÜŞTERİ SİL ---------------------- */
async function deleteClient(req, res, next) {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `DELETE FROM public.clients WHERE id=$1 RETURNING id, name`,
      [id]
    );
    if (result.rowCount === 0)
      return res.status(404).json({ message: 'Müşteri bulunamadı' });
    res.json({ message: 'Müşteri silindi', client: result.rows[0] });
  } catch (e) {
    next(e);
  }
}

module.exports = {
  listClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
};
