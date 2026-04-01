const routes = require('express').Router();
const ctrl = require('../controllers/search.controller');

router.get('/origins', ctrl.getOrigins);
router.get('/cities', ctrl.getCities);
router.get('/flights', ctrl.getFlights);
router.get('/hotels', ctrl.searchHotels);
router.get('/packages', ctrl.searchPackages);

module.exports = router;