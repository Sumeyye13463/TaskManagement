// src/controllers/users_controller.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../db/pool');

async function createUser(req, res) {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
  return res.status(400).json({ message: 'username, email, password zorunlu' });
}

const hash = await bcrypt.hash(password, 10);

const { rows } = await pool.query(
  `INSERT INTO users (username, email, password)
   VALUES ($1, $2, $3)
   RETURNING id, username, email, created_at`,
  [username, email, hash]
);

return res.status(201).json(rows[0]);

  } catch (e) {
    if (e.code === '23505') {
      return res.status(409).json({ message: 'Email zaten kayıtlı' });
    }
    return res.status(500).json({ message: 'Sunucu hatası', detail: e.message });
  }
}

// controllers/users.controller.js
async function listUsers(req, res) {
  const { rows } = await pool.query(`
    SELECT id, username, email, title, is_active, created_at
    FROM public.users
    ORDER BY id DESC
  `);
  res.json(rows);
}

async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "Kullanıcı ID gerekli" });

    // Silme işlemi
    const result = await pool.query(
      "DELETE FROM public.users WHERE id = $1 RETURNING id, username, email",
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    }

    res.json({ message: "Kullanıcı silindi", user: result.rows[0] });
  } catch (e) {
    console.error("DELETE /api/users/:id error:", e);
    res.status(500).json({ message: "Sunucu hatası", detail: e.message });
  }
}


async function loginUser(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'email ve password zorunlu' });
    }

    const { rows } = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
    const user = rows[0];
    if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı' });

    const ok = await bcrypt.compare(password, user.password); // <-- burada password
    if (!ok) return res.status(401).json({ message: 'Şifre yanlış' });

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      message: 'Giriş başarılı',
      token,
      user: { id: user.id, name: user.username, email: user.email } // <-- username'den name
    });
  } catch (e) {
    res.status(500).json({ message: 'Sunucu hatası', detail: e.message });
  }
}


module.exports = { createUser, listUsers, loginUser, deleteUser };
// 🔴 DİKKAT: module_exports DEĞİL, module.exports
