const express = require('express');
const router = express.Router();
const { authGuard, requireRole, requireProjectMember } = require('../middlewares/auth.middleware');
const { createTask, updateTask, deleteTask, listTasks, getTask } = require('../controllers/tasks.controller');

// Listeleme / tek task okuma: üye olmak yeterli (projeye göre filtre varsa controller’da uygula)
router.get('/',    authGuard, listTasks);
router.get('/:id', authGuard, getTask);

// Oluşturma: globalde en az 'member' olsun + projede owner/manager/member olsun
router.post('/',
  authGuard,
  requireRole(['admin','owner','manager','member']),
  requireProjectMember(['owner','manager','member']),
  createTask
);

// Güncelleme: globalde en az 'member' + projede owner/manager
router.put('/:id',
  authGuard,
  requireRole(['admin','owner','manager','member']),
  requireProjectMember(['owner','manager']),
  updateTask
);

// Silme: globalde admin/owner/manager + projede owner/manager
router.delete('/:id',
  authGuard,
  requireRole(['admin','owner','manager']),
  requireProjectMember(['owner','manager']),
  deleteTask
);

module.exports = router;
