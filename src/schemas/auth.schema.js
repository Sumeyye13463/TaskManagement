// src/schemas/auth.schema.js
const { z } = require("zod");

const passwordPolicy = z.string()
  .min(8, "Parola en az 8 karakter olmalı")
  .regex(/[a-z]/, "En az bir küçük harf içermeli")
  .regex(/[A-Z]/, "En az bir büyük harf içermeli")
  .regex(/[0-9]/, "En az bir rakam içermeli")
  .regex(/[^A-Za-z0-9]/, "En az bir özel karakter içermeli");

const registerSchema = z.object({
  body: z.object({
    username: z.string().min(3, "Kullanıcı adı en az 3 karakter"),
    email: z.string().email("Geçerli bir e-posta girin"),
    password: passwordPolicy
  })
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
    otp: z.string().optional() // MFA aktifse login’de gelebilir
  })
});

const mfaSetupSchema = z.object({
  // setup çağrısı body istemez; JWT’li kullanıcı
  body: z.object({}).optional(),
});

const mfaVerifySchema = z.object({
  body: z.object({
    token: z.string().min(6).max(6, "6 haneli kod girin")
  })
});

module.exports = {
  registerSchema,
  loginSchema,
  mfaSetupSchema,
  mfaVerifySchema,
};
