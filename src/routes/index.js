/*const express = require('express');
const router = express.Router();
const pool = require('../db');

// @route   GET api/users
// @desc    Get all users
// @access  Public
router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM users');
    res.json(result.rows);
  } catch (err) {
    console.error('GET /api/users error:', err);
    next(err);
  }
});

// @route   POST api/users/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // Check if user already exists
    const userExists = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // Create new user
    const newUser = await pool.query(
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *',
      [username, password]
    );

    res.status(201).json(newUser.rows[0]);
  } catch (err) {
    console.error('POST /api/users/register error:', err);
    next(err);
  }
});

module.exports = router;*/

const express = require('express');
const router = express.Router();

router.use('/users', require('./users.routes'));
router.use('/clients', require('./clients.routes'));
router.use('/projects', require('./projects.routes'));
router.use('/labels',   require('./labels.routes')); 
router.use('/tasks', require('./tasks.routes'));
const { authGuard, requireRole } = require('../middlewares/auth.middleware');
router.use('/auth',     require('./auth.routes'));
module.exports = router; 