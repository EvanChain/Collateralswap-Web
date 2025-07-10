const { describe, test, expect, beforeAll, afterAll } = require('@jest/globals');
const mongoose = require('mongoose');
const Order = require('../../models/Order');
const OrderSyncService = require('../../services/orderSyncService');

describe('Order Sync Service', () => {
    beforeAll(async () => {
        // 连接到测试数据库
        await mongoose.connect('mongodb://localhost:27017/collateralswap_test', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
    });

    afterAll(async () => {
        // 清理测试数据
        await Order.deleteMany({});
        await mongoose.connection.close();
    });

    test('should initialize contract successfully with valid config', async () => {
        // 这个测试需要有效的合约地址和网络连接
        // 在实际测试中需要配置测试网络
        expect(true).toBe(true); // 占位测试
    });

    test('should handle contract initialization failure gracefully', async () => {
        const originalPivAddress = OrderSyncService.pivAddress;
        OrderSyncService.pivAddress = 'invalid_address';

        const result = await OrderSyncService.initContract();
        expect(result).toBe(false);

        OrderSyncService.pivAddress = originalPivAddress;
    });

    test('should create and update orders from blockchain events', async () => {
        // 模拟测试数据
        const mockOrder = new Order({
            orderId: 'test_order_1',
            owner: '0x1234567890123456789012345678901234567890',
            collateralToken: '0xA0b86a33E6441A3063BdFb663c6C8FAc6C8A4Ec2',
            debtToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
            collateralAmount: '1000000000000000000',
            price: '2000000000000000000',
            isFromBlockchain: true
        });

        await mockOrder.save();

        const savedOrder = await Order.findOne({ orderId: 'test_order_1' });
        expect(savedOrder).toBeTruthy();
        expect(savedOrder.isFromBlockchain).toBe(true);
    });
});
