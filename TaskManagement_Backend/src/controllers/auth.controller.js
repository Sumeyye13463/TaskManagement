// src/controllers/auth.controller.js
const bcrypt = require("bcrypt");
const { pool } = require("../db/pool");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");              // ← EKLE
const { verifyToken } = require("../utils/totp");      // ← SADECE verify burada
const { generateMfaSecret } = require("../services/mfa"); // ← QR/secret buradan

const ACCESS_TTL = process.env.ACCESS_TOKEN_TTL || "15m";
const JWT_SECRET = process.env.JWT_SECRET;

async function firstLoginSetPassword(req, res) {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ message: "token ve password gerekli" });
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(400).json({ message: "Token geçersiz veya süresi doldu" });
    }
    if (payload.purpose !== "first_login") {
      return res.status(400).json({ message: "Geçersiz amaç (purpose)" });
    }

    const hash = await bcrypt.hash(password, 10);

    await pool.query(
      `UPDATE public.users
         SET password_hash = $1,
             updated_at = NOW()
       WHERE id = $2`,
      [hash, payload.sub]
    );

    // İsteğe bağlı: burada direkt login token da dönebilirsin
    // const accessToken = jwt.sign({ sub: payload.sub, email: payload.email }, process.env.JWT_SECRET, { expiresIn: "1d" });

    return res.json({ message: "Şifre başarıyla belirlendi" });
  } catch (e) {
    console.error("firstLoginSetPassword error:", e);
    return res.status(500).json({ message: "Sunucu hatası", detail: e.message });
  }
}

// helper: jwt
function signAccessToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role || "member" },
    JWT_SECRET,
    { expiresIn: ACCESS_TTL }
  );
}

async function registerAdmin(req, res) {
  try {
    const { username, email, password } = req.body;
    const hash = await bcrypt.hash(password, 10);

    // ✅ Yalnızca mevcut kolonlara göre ekleme
    const { rows } = await pool.query(
      `INSERT INTO public.users (username, email, password_hash)
        VALUES ($1, $2, $3)
        RETURNING id, username, email`,
      [username, email, hash]
    );

    const user = rows[0];
    const accessToken = signAccessToken(user); // user.role artık 'admin'

    return res.status(201).json({ user, accessToken });
  } catch (e) {
    if (e.code === "23505") {
      return res.status(409).json({ message: "Email zaten kayıtlı" });
    }
    return res.status(500).json({ message: "Sunucu hatası", detail: e.message });
  }
}

/* USER REGISTER */
async function register(req, res, next) {
  try {
    const { username, email, password } = req.body;

    // e-posta uniq?
    const exist = await pool.query(
      "SELECT id FROM public.users WHERE email=$1",
      [email]
    );
    if (exist.rowCount > 0) {
      return res.status(409).json({ message: "Bu e-posta zaten kayıtlı" });
    }

    const hash = await bcrypt.hash(password, 10);

    const { rows } = await pool.query(
      `INSERT INTO public.users (username, email, password_hash)
       VALUES ($1,$2,$3)
       RETURNING id, username, email, role, mfa_enabled`,
      [username, email, hash]
    );

    const user = rows[0];
    const accessToken = signAccessToken(user);
    res.status(201).json({ user, accessToken });
  } catch (e) { next(e); }
}

/* USER LOGIN (MFA aware) */
async function login(req, res, next) {
  try {
    const { email, password, otp } = req.body;

    const u = await pool.query(
      `SELECT id, username, email, role, password_hash, mfa_enabled, mfa_secret
       FROM public.users WHERE email=$1`,
      [email]
    );
    if (u.rowCount === 0) return res.status(401).json({ message: "Geçersiz kimlik" });

    const user = u.rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ message: "Geçersiz kimlik" });

    // MFA aktifse OTP bekliyoruz
    if (user.mfa_enabled) {
      if (!otp) {
        return res.status(200).json({
          mfa_required: true,
          message: "OTP gerekli (Google Authenticator kodunu girin)"
        });
      }
      const verified = verifyToken({ secretBase32: user.mfa_secret, token: otp });
      if (!verified) return res.status(401).json({ message: "OTP doğrulanamadı" });
    }

    const accessToken = signAccessToken(user);
    res.json({
      user: {
        id: user.id, username: user.username, email: user.email, role: user.role,
        mfa_enabled: user.mfa_enabled
      },
      accessToken
    });
  } catch (e) { next(e); }
}

/* MFA SETUP — secret üret, QR gönder (sadece login olmuş kullanıcı) */
async function mfaSetup(req, res, next) {
  try {
    const userId = req.user?.sub; // authGuard set etmeli
    const me = await pool.query(
      "SELECT id, email, mfa_enabled FROM public.users WHERE id=$1",
      [userId]
    );
    if (me.rowCount === 0) return res.status(404).json({ message: "Kullanıcı bulunamadı" });

    const email = me.rows[0].email;
    const { base32, otpauthUrl, qrDataUrl } = await generateMfaSecret(email);

    // secret'ı şimdilik DB'ye yaz ama mfa_enabled = false kalsın; verify’den sonra true yapacağız
    await pool.query(
      "UPDATE public.users SET mfa_secret=$1 WHERE id=$2",
      [base32, userId]
    );

    res.json({
      secret: base32,           // UI'de gösterme, sakla; istersen gönderme
      otpauthUrl,
      qrDataUrl                // <img src={qrDataUrl} />
    });
  } catch (e) { next(e); }
}

/* MFA VERIFY — kullanıcı uygulamaya ekledikten sonra 6 haneli kodu girer */
async function mfaVerify(req, res, next) {
  try {
    const userId = req.user?.sub;
    const { token } = req.body;

    const u = await pool.query(
      "SELECT id, mfa_secret FROM public.users WHERE id=$1",
      [userId]
    );
    if (u.rowCount === 0) return res.status(404).json({ message: "Kullanıcı yok" });

    const ok = verifyToken({ secretBase32: u.rows[0].mfa_secret, token });
    if (!ok) return res.status(400).json({ message: "OTP geçersiz" });

    await pool.query(
      "UPDATE public.users SET mfa_enabled=true WHERE id=$1",
      [userId]
    );

    res.json({ message: "MFA etkinleştirildi" });
  } catch (e) { next(e); }
}

/* MFA DISABLE — güvenlik gereği şifre doğrulaması isteyebilirsin */
async function mfaDisable(req, res, next) {
  try {
    const userId = req.user?.sub;
    await pool.query(
      "UPDATE public.users SET mfa_enabled=false, mfa_secret=NULL WHERE id=$1",
      [userId]
    );
    res.json({ message: "MFA kapatıldı" });
  } catch (e) { next(e); }
}

// POST /api/auth/mfa/setup-by-invite
// Header: Authorization: Bearer <inviteToken>  (veya body.token)
async function mfaSetupByInvite(req, res) {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : (req.body?.token || '');
    if (!token) return res.status(400).json({ message: 'invite token gerekli' });

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ message: 'Geçersiz veya süresi dolmuş davet' });
    }
    if (payload.purpose !== 'invite') {
      return res.status(400).json({ message: 'Geçersiz amaç' });
    }

    const r = await pool.query(
      `SELECT id, email, mfa_secret, mfa_enabled FROM public.users WHERE id=$1`,
      [payload.sub]
    );
    if (r.rowCount === 0) return res.status(404).json({ message: 'Kullanıcı yok' });

    const user = r.rows[0];

    // Davet tek kullanımlı: secret zaten varsa durdur
    if (user.mfa_secret && user.mfa_secret.trim() !== '') {
      return res.status(409).json({ message: 'Davet linki zaten kullanılmış' });
    }

    // Secret üret → DB'ye yaz → QR döndür
    const { base32, otpauthUrl, qrDataUrl } = await generateMfaSecret(user.email);
    await pool.query(`UPDATE public.users SET mfa_secret=$1 WHERE id=$2`, [base32, user.id]);

    res.json({ qrDataUrl, otpauthUrl });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
}

async function sendInvite(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "email gerekli" });

    const q = await pool.query(
      `SELECT id, email, mfa_enabled, mfa_secret FROM public.users WHERE email=$1`,
      [email]
    );
    if (q.rowCount === 0)
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });

    const user = q.rows[0];
    if (user.mfa_enabled) {
      return res
        .status(409)
        .json({ message: "Bu kullanıcı için MFA zaten aktif" });
    }

    // 30 dakikalık invite token
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
      text: `MFA kurulum linki: ${inviteUrl} (30 dk)`,
    });

    res.json({ message: "Davet e-postası gönderildi" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Sunucu hatası" });
  }
}


module.exports = {
  register,
  login,
  mfaSetup,
  mfaVerify,
  mfaDisable,
  registerAdmin,
  mfaSetupByInvite, 
  firstLoginSetPassword
};