const express = require('express');
const bcrypt = require('bcrypt');
const cors = require('cors');
const morgan = require('morgan'); 
const { pool } = require('./db/pool');
const api = require('./routes')
const usersRouter = require('./routes/users.routes');
const authRouter = require('./routes/auth.routes'); 


const app = express();

const error = require('./middlewares/error'); 

app.use(cors());        // frontend'ten istek için
app.use(express.json()); 
app.use(morgan('dev'));

app.use('/api', api);
app.use('/api/users', usersRouter);
app.use('/api/auth', authRouter); 

app.get('/', (req, res) =>
  res.json({ ok: true, service: 'backend-projesi', endpoints: ['/health','/dbtest','/api/users'] })
);

// Sağlık kontrolü+
app.get('/health', (req, res) => res.json({ ok: true }));

// DB test
app.get('/dbtest', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ message: 'Bağlantı başarılı!', time: result.rows[0].now });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Bağlantı hatası!', error: err.message });
  }
});

// 👇 yeni: users router
app.use('/api/users', usersRouter);

{
  // Global error handler — route'ların / middleware'lerin en sonuna ekleyin
  app.use((err, req, res, next) => {
    console.error('Unhandled error:', err && err.stack ? err.stack : err);
    res.status(err && err.status ? err.status : 500).json({
      error: err && err.message ? err.message : 'Internal Server Error'
    });
  });
}

const path = require('path');
app.use('/public', require('express').static(path.join(__dirname, 'public')));

app.use(require('./middlewares/error'));

module.exports = app;
