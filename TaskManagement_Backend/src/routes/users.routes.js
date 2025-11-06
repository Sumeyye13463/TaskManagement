const express = require('express');
const router = express.Router();

// ⛔️ BUNU SİL (varsa): const authGuardAdmin = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate');
const { updateUserTitleSchema } = require('../schemas/users.schemas');
const { authGuard, requireRole } = require('../middlewares/auth.middleware');

// Controller fonksiyonları (senin dosyandaki isimlerle)
const {
  createUser,
  listUsers,
  loginUser,
  deleteUser,
  getUserById,
  setRole,
  updateUserTitle,
  sendInvite,
  sendFirstLoginMail,
  firstLoginEmail,
} = require('../controllers/users.controller');

// (Geçici) Teşhis logları — ÇALIŞTIRIP SONRA SİLEBİLİRSİN
console.log('sendInvite type:', typeof sendInvite);          
console.log('authGuard type:', typeof authGuard);           
console.log('requireRole type:', typeof requireRole);       
console.log('requireRole(["admin"]) type:', typeof requireRole(['admin']));

// Routes
router.get('/', listUsers);
router.post('/', createUser);
router.post('/login', loginUser);
router.delete('/:id', deleteUser);
router.get('/:id', getUserById);

router.patch('/:id/role', setRole);
router.patch('/:id', validate(updateUserTitleSchema), updateUserTitle);

// 🔒 Davet: önce JWT → sonra admin rolü → sonra handler
router.post('/invite', authGuard, requireRole(['admin']), sendInvite);

router.post("/first-login-email", authGuard, requireRole(['admin']), firstLoginEmail);


module.exports = router;
