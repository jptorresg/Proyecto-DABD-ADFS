const router = require('express').Router();
const ctrl = require('../controllers/notificacion.controller');

router.get('/', (req, res) => res.json({ ok: true, message: 'Notificaciones OK' }));
router.post('/webhook', ctrl.recibirCambio);

module.exports = router;