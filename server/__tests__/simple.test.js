const request = require('supertest');
const express = require('express');
const Order = require('../models/Order');

// 简单的mock
jest.mock('web3', () => jest.fn());

// 创建简单的测试应用
const app = express();
app.use(express.json());

// 简单的路由处理
app.post('/api/orders/create', async (req, res) => {
    try {
        const order = new Order(req.body);
        await order.save();
        res.status(201).json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/api/orders/list', async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

describe('Simple Order Tests', () => {
    describe('Order Model Basic Tests', () => {
        it('should create a new order successfully', async () => {
            const orderData = {
                owner: '0x1234567890123456789012345678901234567890',
                collateralToken: '0xA0b86a33E6441b8435b662Ad4C8fe0Cc8f8CCC5c',
                debtToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                collateralAmount: '1000000000000000000',
                price: '2000000000000000000'
            };

            const order = new Order(orderData);
            const savedOrder = await order.save();

            expect(savedOrder._id).toBeDefined();
            expect(savedOrder.owner).toBe(orderData.owner);
            expect(savedOrder.status).toBe('OPEN');
            expect(savedOrder.filledAmount).toBe('0');
        });

        it('should fail validation when required fields are missing', async () => {
            const order = new Order({});

            let error;
            try {
                await order.save();
            } catch (err) {
                error = err;
            }

            expect(error).toBeDefined();
            expect(error.errors.owner).toBeDefined();
        });
    });

    describe('API Endpoint Tests', () => {
        it('should create order via API', async () => {
            const orderData = {
                owner: '0x1234567890123456789012345678901234567890',
                collateralToken: '0xA0b86a33E6441b8435b662Ad4C8fe0Cc8f8CCC5c',
                debtToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                collateralAmount: '1000000000000000000',
                price: '2000000000000000000'
            };

            const response = await request(app)
                .post('/api/orders/create')
                .send(orderData)
                .expect(201);

            expect(response.body).toMatchObject(orderData);
            expect(response.body._id).toBeDefined();
        });

        it('should list orders via API', async () => {
            // 先创建一个订单
            const orderData = {
                owner: '0x1234567890123456789012345678901234567890',
                collateralToken: '0xA0b86a33E6441b8435b662Ad4C8fe0Cc8f8CCC5c',
                debtToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                collateralAmount: '1000000000000000000',
                price: '2000000000000000000'
            };

            await new Order(orderData).save();

            const response = await request(app)
                .get('/api/orders/list')
                .expect(200);

            expect(response.body).toHaveLength(1);
            expect(response.body[0]).toMatchObject(orderData);
        });

        it('should return empty array when no orders exist', async () => {
            const response = await request(app)
                .get('/api/orders/list')
                .expect(200);

            expect(response.body).toEqual([]);
        });
    });

    describe('Data Validation Tests', () => {
        it('should validate order status enum', async () => {
            const validStatuses = ['OPEN', 'FILLED', 'CANCELLED'];

            for (const status of validStatuses) {
                const orderData = {
                    owner: '0x1234567890123456789012345678901234567890',
                    collateralToken: '0xA0b86a33E6441b8435b662Ad4C8fe0Cc8f8CCC5c',
                    debtToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                    collateralAmount: '1000000000000000000',
                    price: '2000000000000000000',
                    status: status
                };

                const order = new Order(orderData);
                const savedOrder = await order.save();

                expect(savedOrder.status).toBe(status);
            }
        });

        it('should reject invalid status', async () => {
            const orderData = {
                owner: '0x1234567890123456789012345678901234567890',
                collateralToken: '0xA0b86a33E6441b8435b662Ad4C8fe0Cc8f8CCC5c',
                debtToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                collateralAmount: '1000000000000000000',
                price: '2000000000000000000',
                status: 'INVALID_STATUS'
            };

            const order = new Order(orderData);

            let error;
            try {
                await order.save();
            } catch (err) {
                error = err;
            }

            expect(error).toBeDefined();
            expect(error.errors.status).toBeDefined();
        });
    });

    describe('BigInt Calculations', () => {
        it('should handle large numbers correctly', async () => {
            const largeAmount = '999999999999999999999999999999';

            const orderData = {
                owner: '0x1234567890123456789012345678901234567890',
                collateralToken: '0xA0b86a33E6441b8435b662Ad4C8fe0Cc8f8CCC5c',
                debtToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                collateralAmount: largeAmount,
                price: '1000000000000000000'
            };

            const order = new Order(orderData);
            const savedOrder = await order.save();

            expect(savedOrder.collateralAmount).toBe(largeAmount);

            // 测试BigInt运算
            expect(() => {
                const amount = BigInt(savedOrder.collateralAmount);
                const price = BigInt(savedOrder.price);
                const result = amount * price / BigInt('1000000000000000000');
                expect(result).toBeDefined();
            }).not.toThrow();
        });
    });
});
