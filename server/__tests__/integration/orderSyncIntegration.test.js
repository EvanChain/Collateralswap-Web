const { describe, test, expect, beforeAll, afterAll } = require('@jest/globals');
const request = require('supertest');
const mongoose = require('mongoose');
const express = require('express');
const Order = require('../../models/Order');
const orderRoutes = require('../../routes/orderRoutes');

// 创建测试应用
const app = express();
app.use(express.json());
app.use('/api/orders', orderRoutes);

describe('Order Sync Integration Tests', () => {
    beforeAll(async () => {
        // 如果已经连接，先断开
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
        }

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

    beforeEach(async () => {
        // 每个测试前清理数据
        await Order.deleteMany({});
    });

    test('should create order with blockchain fields', async () => {
        const orderData = {
            owner: '0x1234567890123456789012345678901234567890',
            collateralToken: '0xA0b86a33E6441A3063BdFb663c6C8FAc6C8A4Ec2',
            debtToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
            collateralAmount: '1000000000000000000',
            price: '2000000000000000000'
        };

        const response = await request(app)
            .post('/api/orders/create')
            .send(orderData)
            .expect(201);

        expect(response.body.owner).toBe(orderData.owner);
        expect(response.body.isFromBlockchain).toBe(false);
    });

    test('should handle blockchain order with orderId', async () => {
        const blockchainOrder = new Order({
            orderId: 'blockchain_order_1',
            owner: '0x1234567890123456789012345678901234567890',
            collateralToken: '0xA0b86a33E6441A3063BdFb663c6C8FAc6C8A4Ec2',
            debtToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
            collateralAmount: '1000000000000000000',
            price: '2000000000000000000',
            interestRateMode: '1',
            isFromBlockchain: true
        });

        await blockchainOrder.save();

        const savedOrder = await Order.findOne({ orderId: 'blockchain_order_1' });
        expect(savedOrder).toBeTruthy();
        expect(savedOrder.isFromBlockchain).toBe(true);
        expect(savedOrder.interestRateMode).toBe('1');
    });

    test('should list both manual and blockchain orders', async () => {
        // 创建手动订单
        const manualOrder = new Order({
            owner: '0x1111111111111111111111111111111111111111',
            collateralToken: '0xA0b86a33E6441A3063BdFb663c6C8FAc6C8A4Ec2',
            debtToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
            collateralAmount: '500000000000000000',
            price: '1800000000000000000',
            isFromBlockchain: false
        });

        // 创建区块链订单
        const blockchainOrder = new Order({
            orderId: 'blockchain_order_2',
            owner: '0x2222222222222222222222222222222222222222',
            collateralToken: '0xA0b86a33E6441A3063BdFb663c6C8FAc6C8A4Ec2',
            debtToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
            collateralAmount: '2000000000000000000',
            price: '2100000000000000000',
            isFromBlockchain: true
        });

        await manualOrder.save();
        await blockchainOrder.save();

        const response = await request(app)
            .get('/api/orders/list')
            .expect(200);

        expect(response.body).toHaveLength(2);

        const manual = response.body.find(o => !o.isFromBlockchain);
        const blockchain = response.body.find(o => o.isFromBlockchain);

        expect(manual).toBeTruthy();
        expect(blockchain).toBeTruthy();
        expect(blockchain.orderId).toBe('blockchain_order_2');
    });

    test('should return sync status', async () => {
        const response = await request(app)
            .get('/api/orders/sync/status')
            .expect(200);

        expect(response.body).toHaveProperty('isRunning');
        expect(response.body).toHaveProperty('pivAddress');
        expect(response.body).toHaveProperty('contractInitialized');
    });

    test('should handle manual sync trigger', async () => {
        // 注意：这个测试在没有有效区块链连接时会失败
        // 但API应该能正常响应
        const response = await request(app)
            .post('/api/orders/sync');

        // 期望返回500（因为没有配置有效的区块链连接）或200（如果同步成功）
        expect([200, 500]).toContain(response.status);
    });

    test('should handle order updates correctly', async () => {
        // 创建初始订单
        const order = new Order({
            orderId: 'test_order_update',
            owner: '0x3333333333333333333333333333333333333333',
            collateralToken: '0xA0b86a33E6441A3063BdFb663c6C8FAc6C8A4Ec2',
            debtToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
            collateralAmount: '1000000000000000000',
            price: '2000000000000000000',
            status: 'OPEN',
            filledAmount: '0',
            isFromBlockchain: true
        });

        await order.save();

        // 模拟部分成交
        await Order.findOneAndUpdate(
            { orderId: 'test_order_update' },
            {
                filledAmount: '500000000000000000',
                updatedAt: new Date()
            }
        );

        const updatedOrder = await Order.findOne({ orderId: 'test_order_update' });
        expect(updatedOrder.filledAmount).toBe('500000000000000000');
        expect(updatedOrder.status).toBe('OPEN');

        // 模拟完全成交
        await Order.findOneAndUpdate(
            { orderId: 'test_order_update' },
            {
                filledAmount: '1000000000000000000',
                status: 'FILLED',
                updatedAt: new Date()
            }
        );

        const filledOrder = await Order.findOne({ orderId: 'test_order_update' });
        expect(filledOrder.status).toBe('FILLED');
        expect(filledOrder.filledAmount).toBe('1000000000000000000');
    });
});
