// src/routes/pm.routes.js
const router = require('express').Router();
const auth = require('../middlewares/auth');        // sende mevcut
const requireRole = require('../middlewares/requireRole');
const pm = require('../controllers/pm.controller');

router.use(auth, requireRole('project_manager', 'admin'));

// Projects
router.get('/projects', pm.listProjects);
router.post('/projects', pm.createProject);
router.get('/projects/:id', pm.getProject);
router.put('/projects/:id', pm.updateProject);
router.delete('/projects/:id', pm.archiveProject);

module.exports = router;
