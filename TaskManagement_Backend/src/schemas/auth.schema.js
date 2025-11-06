// src/schemas/auth.schema.js
const { z } = require("zod");

// yardımcı: sayısal 6 haneli kod
const sixDigitCode = z.string().regex(/^\d{6}$/, "Kod 6 haneli olmalı");

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  username: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["member", "manager", "admin"]).default("member"),
});

const firstLoginSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(6),
});

const mfaSetupSchema = z.object({}); // body yoksa boş bırak
const mfaVerifySchema = z.object({ code: sixDigitCode });

module.exports = {
  loginSchema,
  registerSchema,
  mfaSetupSchema,
  mfaVerifySchema,
  firstLoginSchema,
};
