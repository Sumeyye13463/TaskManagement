// src/controllers/users_controller.js
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { pool } = require("../db/pool");
const nodemailer = require("nodemailer");

async function getUserById(req, res) {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      `SELECT id, username, email, title, is_active, created_at
         FROM users
        WHERE id = $1`,
      [id]
    );
    if (!rows.length) return res.status(404).json({ message: "User not found" });
    return res.json(rows[0]);
  } catch (e) {
    return res.status(500).json({ message: "Sunucu hatası", detail: e.message });
  }
}
async function createUser(req, res) {
  try {
    const { username, email, title, role, password, phone } = req.body; 

    if (!username || !email || !password) {
      return res.status(400).json({ message: "Zorunlu alanlar eksik." });
    }

    const hash = await bcrypt.hash(password, 10);
    const roleDb = normalizeRole(role);

    const { rows } = await pool.query(
      `INSERT INTO users (username, email, title, role, password_hash, phone, is_active, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, true, NOW())
       RETURNING id, username, email, title, role, phone, is_active, created_at`,
      [username, email, title, roleDb, hash, phone || null] // ✅ phone parametresi eklendi
    );

    const created = rows[0];

   // const firstLoginToken = signFirstLoginToken(created.id, created.email);
    //const appUrl = process.env.APP_URL || "http://localhost:5173";
    //const firstLoginUrl = `${appUrl}/first-login?token=${encodeURIComponent(firstLoginToken)}`;

    //await sendFirstLoginMail(created.email, firstLoginUrl);

    // İstersen response'a da ek bilgi dönebilirsin (gizlilik gereği token’ı dönmeyelim)
    return res.status(201).json(created);


    return res.status(201).json(rows[0]);
  } catch (e) {
    if (e.code === "23505") {
      return res.status(409).json({ message: "Email zaten kayıtlı" });
    }
    return res.status(500).json({ message: "Sunucu hatası", detail: e.message });
  }
}

// controllers/users.controller.js
async function listUsers(req, res) {
  const { rows } = await pool.query(`
    SELECT id, username, email, title, is_active, role, created_at, phone
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

    const { rows } = await pool.query(
      `SELECT id, username, email, role, password_hash
       FROM public.users
       WHERE email=$1`,
      [email]
    );
    const user = rows[0];
    if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı' });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ message: 'Şifre yanlış' });

    // Role token'a gömülsün
    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role || 'member' },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      message: 'Giriş başarılı',
      token,
      user: { id: user.id, name: user.username, email: user.email, role: user.role || 'member' }
    });
  } catch (e) {
    res.status(500).json({ message: 'Sunucu hatası', detail: e.message });
  }
}

function normalizeRole(input) {
  if (!input) return "member";
  const map = {
    "Çalışan": "member",
    "calisan": "member",
    "çalışan": "member",
    "Yönetici": "manager",
    "yonetici": "manager",
    "yönetici": "manager",
    "Admin": "admin",
    "admin": "admin",
    "manager": "manager",
    "member": "member",
  };
  return map[input] || "member";
}

async function setRole(req, res) {
  try {
    const { id } = req.params;
    const roleDb = normalizeRole(req.body.role);
    const { rows } = await pool.query(
      `UPDATE users
          SET role = $1, updated_at = NOW()
        WHERE id = $2
      RETURNING id, username, email, title, role, is_active, created_at, password`,
      [roleDb, id]
    );
    if (!rows.length) return res.status(404).json({ message: "User not found" });
    res.json(rows[0]);
  } catch (e) {
    return res.status(500).json({ message: "Sunucu hatası", detail: e.message });
  }
}

async function updateUserTitle(req, res) {
  try {
    const { id } = req.params;
    // title undefined ise 400 dön
    if (!("title" in req.body)) {
      return res.status(400).json({ message: "title alanı gerekli" });
    }
    const title = req.body.title ?? null; // boşsa null yaz

    const { rows } = await pool.query(
      `UPDATE users
         SET title = $1,
             updated_at = NOW()
       WHERE id = $2
       RETURNING id, username, email, role, title, phone, is_active`,
      [title, id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    }
    return res.json(rows[0]);
  } catch (e) {
    console.error("updateUserTitle error:", e);
    return res.status(500).json({ message: "Sunucu hatası", detail: e.message });
  }
}

async function sendInvite(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "email gerekli" });

    const q = await pool.query(
      `SELECT id, email, mfa_secret, mfa_enabled FROM public.users WHERE email=$1`,
      [email]
    );
    if (q.rowCount === 0) return res.status(404).json({ message: "Kullanıcı bulunamadı" });

    const user = q.rows[0];

    // mfa zaten aktifse tekrar davet göndermeye gerek yok
    if (user.mfa_enabled) {
      return res.status(409).json({ message: "Bu kullanıcı için MFA zaten aktif" });
    }

    // 30 dakikalık, amaç: 'invite'
    const token = jwt.sign(
      { sub: user.id, purpose: "invite" },
      process.env.JWT_SECRET,
      { expiresIn: "30m" }
    );

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    const appUrl = process.env.APP_URL || "http://localhost:5173";
    const inviteUrl = `${appUrl}/invite?token=${encodeURIComponent(token)}`;

    await transporter.sendMail({
      from: process.env.MAIL_FROM || '"Projeler" <no-reply@projeler.local>',
      to: user.email,
      subject: "MFA kurulum davetiniz",
      html: `<p>Merhaba,</p>
             <p>MFA kurulumunu başlatmak için <a href="${inviteUrl}">buraya tıklayın</a>.
             <br/><small>Link 30 dakika geçerlidir.</small></p>`,
      text: `MFA kurulumunu başlat: ${inviteUrl} (30 dk geçerli)`,
    });

    res.json({ message: "Davet e-postası gönderildi" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Sunucu hatası" });
  }
}

const ACCESS_TTL = process.env.ACCESS_TOKEN_TTL || "1d";
const JWT_SECRET = process.env.JWT_SECRET;

async function login(req, res) {
  try {
    const { email, password } = req.body; // <-- frontend tam olarak bu iki alanı göndermeli
    if (!email || !password) {
      return res.status(400).json({ message: "email ve password gerekli" });
    }

    const { rows } = await pool.query(
      `SELECT id, username, email, role, password_hash, mfa_enabled
       FROM public.users
       WHERE email=$1`,
      [email]
    );

    const user = rows[0];
    if (!user) return res.status(404).json({ message: "Kullanıcı bulunamadı" });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ message: "Şifre yanlış" });

    const token = signAccessToken(user);

    res.json({
      message: "Giriş başarılı",
      token,
      user: {
        id: user.id,
        name: user.username,
        email: user.email,
        role: user.role,
        mfa_enabled: user.mfa_enabled,
      },
    });
  } catch (e) {
    console.error("login error:", e);
    res.status(500).json({ message: "Sunucu hatası", detail: e.message });
  }
}

function signFirstLoginToken(userId, email) {
  return jwt.sign(
    { sub: userId, email, purpose: "first_login" },
    process.env.JWT_SECRET,
    { expiresIn: "30m" }
  );
}

async function sendFirstLoginMail(toEmail, url) {
 const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: Number(process.env.SMTP_PORT) === 465, // 465 → SSL
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

  await transporter.sendMail({
    from: process.env.MAIL_FROM || '"Mirox" <no-reply@mirox.local>',
    to: toEmail,
    subject: "Hesabını etkinleştir ve şifreni belirle",
    html: `<p>Merhaba,</p>
           <p>Hesabını etkinleştirmek ve şifreni belirlemek için 
           <a href="${url}">bu bağlantıya</a> tıkla.</p>
           <p><small>Bağlantı 30 dk geçerlidir.</small></p>`,
    text: `Hesabını etkinleştir: ${url} (30 dk geçerli)`,
  });
}

// --- FIRST LOGIN EMAIL HANDLER ---
async function firstLoginEmail(req, res) {
  try {
    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({ message: "email gerekli" });
    }

    // Kullanıcı var mı?
    const q = await pool.query(
      `SELECT id, email FROM public.users WHERE email = $1`,
      [email]
    );
    if (q.rowCount === 0) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    }

    const user = q.rows[0];

    // 30 dk geçerli ilk giriş token'ı
    const token = signFirstLoginToken(user.id, user.email);

    const appUrl = process.env.APP_URL || "http://localhost:5173";
    const firstLoginUrl = `${appUrl}/first-login?token=${encodeURIComponent(token)}`;

    await sendFirstLoginMail(user.email, firstLoginUrl);

    return res.json({ message: "İlk giriş e-postası gönderildi" });
  } catch (e) {
    console.error("firstLoginEmail error:", e);
    return res.status(500).json({ message: "Sunucu hatası", detail: e.message });
  }
}


const addUser = async (e) => {
  e.preventDefault();
  const payload = {
    username: form.username.trim(),
    email: form.email.trim(),
    role: form.role,
    title: form.title || null,
    phone: form.phone || null,
    password: genTempPassword(), // 👈
  };
  await api.post("/users", payload);
  await fetchUsers();
};

// src/controllers/users.controller.js
module.exports = {
  createUser,
  listUsers,
  loginUser,
  deleteUser,
  getUserById,
  setRole,
  updateUserTitle,
  sendInvite,
  signFirstLoginToken,
  sendFirstLoginMail,
  addUser,
  firstLoginEmail,
};

// 🔴 DİKKAT: module_exports DEĞİL, module.exports
