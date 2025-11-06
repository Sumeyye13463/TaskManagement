// src/routes/pm.routes.js
const router = require("express").Router();

// ⚠️ Burada auth/role eklemiyoruz; her alt router kendi içinde yönetiyor.
// Böylece mevcut projects.routes.js'teki authGuard / requireRole aynen çalışmaya devam eder.

router.use("/projects", require("./projects.routes"));
router.use("/tasks",    require("./tasks.routes"));
router.use("/labels",   require("./labels.routes"));
router.use("/clients",  require("./clients.routes"));

module.exports = router;
