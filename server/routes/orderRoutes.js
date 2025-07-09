const express = require('express');
const router = express.Router();
const { createOrder, fillOrder, validateCreateOrder } = require('../controllers/orderController');

router.post('/create', validateCreateOrder, createOrder);
router.post('/fill', fillOrder);

module.exports = router;
