const express = require('express');
const {
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  listMembers,
  addMember,
  removeMember
} = require('../controllers/projects.controller');

// 🔒 Yetkilendirme middleware'leri
const { authGuard, requireRole } = require('../middlewares/auth.middleware');

const router = express.Router();

// 🔹 CRUD
router.get('/', authGuard, listProjects);                                     // GET    /api/projects
router.get('/:id', authGuard, getProject);                                    // GET    /api/projects/:id
router.post('/', authGuard, requireRole('admin', 'manager'), createProject);  // POST   /api/projects
router.put('/:id', authGuard, requireRole('admin', 'manager'), updateProject);// PUT    /api/projects/:id
router.delete('/:id', authGuard, requireRole('admin'), deleteProject);        // DELETE /api/projects/:id

// 🔹 Members
router.get('/:id/members', authGuard, listMembers);                           // GET    /api/projects/:id/members
router.post('/:id/members', authGuard, requireRole('admin', 'manager'), addMember); // POST   /api/projects/:id/members
router.delete('/:id/members/:uid', authGuard, requireRole('admin', 'manager'), removeMember); // DELETE /api/projects/:id/members/:uid

module.exports = router;
