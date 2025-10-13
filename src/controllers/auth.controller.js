// src/controllers/auth.controller.js
const bcrypt = require("bcrypt");
const { pool } = require('../db/pool');
const jwt = require("jsonwebtoken");
const { generateMfaSecret, verifyToken } = require("../utils/totp");

const ACCESS_TTL = process.env.ACCESS_TOKEN_TTL || "15m";
const JWT_SECRET = process.env.JWT_SECRET;

// helper: jwt
function signAccessToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role || "member" },
    JWT_SECRET,
    { expiresIn: ACCESS_TTL }
  );
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

module.exports = {
  register,
  login,
  mfaSetup,
  mfaVerify,
  mfaDisable,
};
