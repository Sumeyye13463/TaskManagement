// src/user_routes.js  (veya src/routes/user_routes.js)
const express = require('express');
const router = express.Router();
const { createUser, listUsers, loginUser, deleteUser  } = require('../controllers/users.controller');

router.get('/', listUsers);         // GET /api/users
router.post('/', createUser);       // POST /api/users
router.post('/login', loginUser);   // POST /api/users/login
router.delete('/:id', deleteUser); // DELETE /api/users/:id

module.exports = router;
