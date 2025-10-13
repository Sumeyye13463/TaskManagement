// server.js
require('dotenv').config();
const http = require('http');
const app = require('./app');   
const { pool } = require('./db/pool');            // senin mevcut app.js’in
const { initSocket } = require('./socket'); // yeni dosya

const PORT = process.env.PORT || 4000;

const server = http.createServer(app);
initSocket(server);                          // socket.io’yu http server’a bağla

server.listen(PORT, () => {
  console.log(`Server running → http://localhost:${PORT}`);
});
