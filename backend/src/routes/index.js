// ---------- مونتاژ همه روت‌ها ----------
const express = require('express');

const router = express.Router();

router.use('/auth', require('./auth'));
router.use('/cafes', require('./cafes'));
router.use('/orders', require('./orders'));
router.use('/admin', require('./admin'));
router.use('/plans', require('./plans'));
router.use('/waiter', require('./waiter'));
router.use('/payment', require('./payment'));
router.use('/kitchen', require('./kitchen'));
router.use('/', require('./loyalty')); // /spin ، /profile/:id ، /loyalty/tiers

module.exports = router;
