const express = require('express');
const router = express.Router();
const { createOrder, fillOrder, listOrder, validateCreateOrder } = require('../controllers/orderController');

router.post('/create', validateCreateOrder, createOrder);
router.post('/fill', fillOrder);
router.get('/list', listOrder);


module.exports = router;
