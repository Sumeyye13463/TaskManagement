const express = require('express');
const {
  listClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
} = require('../controllers/clients.controller');

const router = express.Router();

router.get('/', listClients);        // GET    /api/clients
router.get('/:id', getClient);       // GET    /api/clients/:id
router.post('/', createClient);      // POST   /api/clients
router.put('/:id', updateClient);    // PUT    /api/clients/:id
router.delete('/:id', deleteClient); // DELETE /api/clients/:id

module.exports = router;
