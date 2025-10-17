const { pool } = require('../db/pool');
/* -------- LIST -------- */
async function listProjects(req, res, next) {
  try {
    const { client_id, manager_id } = req.query;
    const conds = [], params = [];
    if (client_id)  { params.push(client_id);  conds.push(`p.client_id  = $${params.length}`); }
    if (manager_id) { params.push(manager_id); conds.push(`p.manager_id = $${params.length}`); }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    const { rows } = await pool.query(
      `SELECT p.id, p.name, p.client_id, p.manager_id, p.start_date, p.end_date, p.description,
              p.created_at, p.updated_at,
              c.name AS client_name,
              u.username AS manager_username
       FROM public.projects p
       LEFT JOIN public.clients c ON c.id = p.client_id
       LEFT JOIN public.users   u ON u.id = p.manager_id
       ${where}
       ORDER BY p.id DESC`,
      params
    );
    res.json(rows);
  } catch (e) { next(e); }
}

/* -------- GET ONE -------- */
async function getProject(req, res, next) {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      `SELECT p.id, p.name, p.client_id, p.manager_id, p.start_date, p.end_date, p.description,
              p.created_at, p.updated_at,
              c.name AS client_name,
              u.username AS manager_username
       FROM public.projects p
       LEFT JOIN public.clients c ON c.id = p.client_id
       LEFT JOIN public.users   u ON u.id = p.manager_id
       WHERE p.id=$1`,
      [id]
    );
    if (!rows[0]) return res.status(404).json({ message: 'Proje bulunamadı' });
    res.json(rows[0]);
  } catch (e) { next(e); }
}

/* -------- CREATE -------- */
async function createProject(req, res, next) {
  try {
    let { name, client_id, manager_id, start_date, end_date, description } = req.body;
    if (!name) return res.status(400).json({ message: 'name zorunlu' });

    // TIP DÖNÜŞÜMLERİ (string gelse bile sayı yap)
    const cId = client_id == null || client_id === '' ? null : Number(client_id);
    const mId = manager_id == null || manager_id === '' ? null : Number(manager_id);

    // TEŞHİS LOG'U (geçici)
    console.log('createProject body →', { name, cId, mId, start_date, end_date });

    // referans doğrulama: sadece varsa kontrol et
    if (cId !== null) {
      const c = await pool.query('SELECT 1 FROM public.clients WHERE id=$1', [cId]);
      if (c.rowCount === 0) return res.status(400).json({ message: `client_id geçersiz: ${cId}` });
    }

    if (mId !== null) {
      const m = await pool.query('SELECT 1 FROM public.users WHERE id=$1', [mId]);
      if (m.rowCount === 0) return res.status(400).json({ message: `manager_id geçersiz: ${mId}` });
    }

    const { rows } = await pool.query(
      `INSERT INTO public.projects
       (name, client_id, manager_id, start_date, end_date, description)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING id, name, client_id, manager_id, start_date, end_date, description, created_at`,
      [name, cId, mId, start_date || null, end_date || null, description || null]
    );

    res.status(201).json(rows[0]);
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ message: 'Bu müşteri altında aynı isimde proje var' });
    console.error('createProject error →', e);
    next(e);
  }
}


/* -------- UPDATE -------- */
async function updateProject(req, res, next) {
  try {
    const { id } = req.params;
    const { name, client_id, manager_id, start_date, end_date, description } = req.body;

    const { rows } = await pool.query(
      `UPDATE public.projects
       SET name        = COALESCE($1, name),
           client_id   = COALESCE($2, client_id),
           manager_id  = COALESCE($3, manager_id),
           start_date  = COALESCE($4, start_date),
           end_date    = COALESCE($5, end_date),
           description = COALESCE($6, description),
           updated_at  = NOW()
       WHERE id=$7
       RETURNING id, name, client_id, manager_id, start_date, end_date, description, updated_at`,
      [name || null, client_id || null, manager_id || null, start_date || null, end_date || null, description || null, id]
    );
    if (!rows[0]) return res.status(404).json({ message: 'Proje bulunamadı' });
    res.json(rows[0]);
  } catch (e) { next(e); }
}

/* -------- DELETE -------- */
async function deleteProject(req, res, next) {
  try {
    const { id } = req.params;
    const r = await pool.query(
      `DELETE FROM public.projects WHERE id=$1 RETURNING id, name`,
      [id]
    );
    if (r.rowCount === 0) return res.status(404).json({ message: 'Proje bulunamadı' });
    res.json({ message: 'Proje silindi', project: r.rows[0] });
  } catch (e) { next(e); }
}

/* -------- MEMBERS: LIST / ADD / REMOVE -------- */
async function listMembers(req, res, next) {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      `SELECT pm.user_id, pm.role, pm.added_at,
              u.username, u.email, u.title
       FROM public.project_members pm
       JOIN public.users u ON u.id = pm.user_id
       WHERE pm.project_id = $1
       ORDER BY pm.added_at DESC`,
      [id]
    );
    res.json(rows);
  } catch (e) { next(e); }
}

async function addMember(req, res, next) {
  try {
    const { id } = req.params; // project id
    const { user_id, role } = req.body;
    if (!user_id) return res.status(400).json({ message: 'user_id zorunlu' });

    // var mı kontrolleri
    const p = await pool.query('SELECT id FROM public.projects WHERE id=$1', [id]);
    if (!p.rows[0]) return res.status(404).json({ message: 'Proje bulunamadı' });
    const u = await pool.query('SELECT id FROM public.users WHERE id=$1', [user_id]);
    if (!u.rows[0]) return res.status(400).json({ message: 'user_id geçersiz' });

    // upsert
    const { rows } = await pool.query(
      `INSERT INTO public.project_members (project_id, user_id, role)
       VALUES ($1,$2,COALESCE($3,'member'))
       ON CONFLICT (project_id, user_id)
       DO UPDATE SET role=EXCLUDED.role, added_at=NOW()
       RETURNING project_id, user_id, role, added_at`,
      [id, user_id, role || null]
    );
    res.status(201).json(rows[0]);
  } catch (e) { next(e); }
}

async function removeMember(req, res, next) {
  try {
    const { id, uid } = req.params;
    const r = await pool.query(
      `DELETE FROM public.project_members
       WHERE project_id=$1 AND user_id=$2
       RETURNING project_id, user_id`,
      [id, uid]
    );
    if (r.rowCount === 0) return res.status(404).json({ message: 'Üye bulunamadı' });
    res.json({ message: 'Üye çıkarıldı', membership: r.rows[0] });
  } catch (e) { next(e); }
}

module.exports = {
  listProjects, getProject, createProject, updateProject, deleteProject,
  listMembers, addMember, removeMember
};
