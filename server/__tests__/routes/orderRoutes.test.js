const request = require('supertest');
const express = require('express');
const orderRoutes = require('../../routes/orderRoutes');

// Mock控制器
jest.mock('../../controllers/orderController', () => ({
    createOrder: jest.fn((req, res) => {
        res.status(201).json({ id: 'mock-order-id', ...req.body });
    }),
    fillOrder: jest.fn((req, res) => {
        res.json({
            totalIn: '1000000000000000000',
            totalOut: '500000000000000000',
            matchDetails: []
        });
    }),
    listOrder: jest.fn((req, res) => {
        res.json([
            {
                _id: 'order1',
                owner: '0x1234567890123456789012345678901234567890',
                collateralToken: '0xA0b86a33E6441b8435b662Ad4C8fe0Cc8f8CCC5c',
                debtToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                collateralAmount: '1000000000000000000',
                price: '2000000000000000000',
                status: 'OPEN'
            }
        ]);
    }),
    validateCreateOrder: [
        (req, res, next) => next() // Mock验证中间件
    ]
}));

const { createOrder, fillOrder, listOrder, validateCreateOrder } = require('../../controllers/orderController');

// 创建测试应用
const app = express();
app.use(express.json());
app.use('/api/orders', orderRoutes);

describe('Order Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/orders/create', () => {
        it('should call createOrder controller with validation', async () => {
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

            expect(createOrder).toHaveBeenCalledTimes(1);
            expect(response.body).toMatchObject({
                id: 'mock-order-id',
                ...orderData
            });
        });

        it('should handle route correctly', async () => {
            await request(app)
                .post('/api/orders/create')
                .send({})
                .expect(201);

            expect(createOrder).toHaveBeenCalled();
        });
    });

    describe('POST /api/orders/fill', () => {
        it('should call fillOrder controller', async () => {
            const fillData = {
                tokenIn: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                tokenOut: '0xA0b86a33E6441b8435b662Ad4C8fe0Cc8f8CCC5c',
                amountIn: '1000000000000000000',
                minAmountOut: '500000000000000000'
            };

            const response = await request(app)
                .post('/api/orders/fill')
                .send(fillData)
                .expect(200);

            expect(fillOrder).toHaveBeenCalledTimes(1);
            expect(response.body).toMatchObject({
                totalIn: '1000000000000000000',
                totalOut: '500000000000000000',
                matchDetails: []
            });
        });
    });

    describe('GET /api/orders/list', () => {
        it('should call listOrder controller', async () => {
            const response = await request(app)
                .get('/api/orders/list')
                .expect(200);

            expect(listOrder).toHaveBeenCalledTimes(1);
            expect(response.body).toHaveLength(1);
            expect(response.body[0]).toMatchObject({
                _id: 'order1',
                owner: '0x1234567890123456789012345678901234567890',
                status: 'OPEN'
            });
        });
    });

    describe('Route validation', () => {
        it('should handle invalid routes', async () => {
            await request(app)
                .get('/api/orders/invalid')
                .expect(404);
        });

        it('should handle invalid HTTP methods', async () => {
            await request(app)
                .delete('/api/orders/create')
                .expect(404);
        });
    });
});
