const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');

router.post('/login', ctrl.login);
router.post('/registro', ctrl.register);
router.post('/register', ctrl.register);
router.post('/logout', ctrl.logout);
router.get('/me', ctrl.me);

module.exports = router;