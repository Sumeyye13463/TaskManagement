// src/routes/auth.routes.js
const express = require("express");
const router = express.Router();

const validate = require("../middlewares/validate");
const { authGuard, requireRole, requireProjectMember } = require('../middlewares/auth.middleware');

const {
  registerSchema,
  loginSchema,
  mfaSetupSchema,
  mfaVerifySchema,
} = require("../schemas/auth.schema");

const {
  register, login, mfaSetup, mfaVerify, mfaDisable
} = require("../controllers/auth.controller");

router.post("/register", validate(registerSchema), register);
router.post("/login",    validate(loginSchema),    login);

// MFA
router.post("/mfa/setup",  authGuard, validate(mfaSetupSchema), mfaSetup);
router.post("/mfa/verify", authGuard, validate(mfaVerifySchema), mfaVerify);
router.post("/mfa/disable", authGuard, mfaDisable);

module.exports = router;
