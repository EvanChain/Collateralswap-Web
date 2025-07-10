const express = require('express');
const router = express.Router();
const {
    createOrder,
    fillOrder,
    listOrder,
    validateCreateOrder,
    syncOrders,
    getSyncStatus
} = require('../controllers/orderController');

router.post('/create', validateCreateOrder, createOrder);
router.post('/fill', fillOrder);
router.get('/list', listOrder);
router.post('/sync', syncOrders);
router.get('/sync/status', getSyncStatus);

module.exports = router;
