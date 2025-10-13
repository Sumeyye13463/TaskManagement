const express = require('express');
const {
  listLabels, getLabel, createLabel, updateLabel, deleteLabel
} = require('../controllers/labels.controller');

// 🔒 auth
const { authGuard, requireRole } = require('../middlewares/auth.middleware');

const router = express.Router();

/* CRUD */
router.get('/',     authGuard, listLabels);                                   // GET    /api/labels?project_id=1
router.get('/:id',  authGuard, getLabel);                                     // GET    /api/labels/:id
router.post('/',    authGuard, requireRole('admin','manager'), createLabel);  // POST   /api/labels
router.put('/:id',  authGuard, requireRole('admin','manager'), updateLabel);  // PUT    /api/labels/:id
router.delete('/:id', authGuard, requireRole('admin'), deleteLabel);          // DELETE /api/labels/:id

module.exports = router;
