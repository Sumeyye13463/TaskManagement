const express = require("express");
const router = express.Router();

const validate = require("../middlewares/validate");
const { authGuard } = require("../middlewares/auth.middleware");
const { login, mfaSetup, mfaVerify, mfaDisable, mfaSetupByInvite, register, registerAdmin, firstLoginSetPassword } =
  require("../controllers/auth.controller");

const { loginSchema, registerSchema, mfaSetupSchema, mfaVerifySchema, firstLoginSchema  } =
  require("../schemas/auth.schema");

router.post("/register", validate(registerSchema), register);
router.post("/register-admin", validate(registerSchema), registerAdmin);
router.post("/login", validate(loginSchema), login);

router.post("/mfa/setup", authGuard, validate(mfaSetupSchema), mfaSetup);
router.post("/mfa/verify", authGuard, validate(mfaVerifySchema), mfaVerify);
router.post("/mfa/disable", authGuard, mfaDisable);

router.post("/mfa/setup-by-invite", mfaSetupByInvite);

router.post(
  "/first-login",
  validate(firstLoginSchema),
 firstLoginSetPassword   // ← doğru çağrı
);

module.exports = router;
