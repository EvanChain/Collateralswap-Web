const request = require('supertest');
const express = require('express');
const Order = require('../../models/Order');
const orderRoutes = require('../../routes/orderRoutes');

// Mock Web3 和相关模块
jest.mock('web3');
jest.mock('../../config/appConfig', () => require('../../__mocks__/appConfig'));
jest.mock('../../abis/IRouterAbi.json', () => require('../../__mocks__/IRouterAbi.json'));

const Web3 = require('web3');
const { mockWeb3, mockContractMethods } = require('../../__mocks__/web3');

// 创建测试应用
const app = express();
app.use(express.json());
app.use('/api/orders', orderRoutes);

describe('Order Controller', () => {
    beforeEach(() => {
        // 重置所有mocks
        jest.clearAllMocks();
        mockContractMethods.swap.mockReturnValue({
            call: jest.fn().mockResolvedValue(['1000000000000000000', '900000000000000000'])
        });
    });

    describe('POST /api/orders/create', () => {
        it('should create a new order successfully', async () => {
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

            expect(response.body).toMatchObject({
                owner: orderData.owner,
                collateralToken: orderData.collateralToken,
                debtToken: orderData.debtToken,
                collateralAmount: orderData.collateralAmount,
                price: orderData.price,
                status: 'OPEN',
                filledAmount: '0'
            });
            expect(response.body._id).toBeDefined();
            expect(response.body.createdAt).toBeDefined();
            expect(response.body.updatedAt).toBeDefined();
        });

        it('should fail validation with missing required fields', async () => {
            const invalidOrderData = {
                owner: '0x1234567890123456789012345678901234567890'
                // 缺少其他必需字段
            };

            const response = await request(app)
                .post('/api/orders/create')
                .send(invalidOrderData)
                .expect(400);

            expect(response.body.errors).toBeDefined();
            expect(response.body.errors.length).toBeGreaterThan(0);
        });

        it('should fail validation with empty strings', async () => {
            const invalidOrderData = {
                owner: '',
                collateralToken: '',
                debtToken: '',
                collateralAmount: '',
                price: ''
            };

            const response = await request(app)
                .post('/api/orders/create')
                .send(invalidOrderData)
                .expect(400);

            expect(response.body.errors).toBeDefined();
            expect(response.body.errors.length).toBe(5); // 所有5个字段都应该有错误
        });

        it('should fail validation with non-string values', async () => {
            const invalidOrderData = {
                owner: 123,
                collateralToken: true,
                debtToken: null,
                collateralAmount: {},
                price: []
            };

            const response = await request(app)
                .post('/api/orders/create')
                .send(invalidOrderData)
                .expect(400);

            expect(response.body.errors).toBeDefined();
            expect(response.body.errors.length).toBe(5);
        });
    });

    describe('GET /api/orders/list', () => {
        it('should return empty array when no orders exist', async () => {
            const response = await request(app)
                .get('/api/orders/list')
                .expect(200);

            expect(response.body).toEqual([]);
        });

        it('should return all orders sorted by creation date descending', async () => {
            // 创建测试订单
            const order1Data = {
                owner: '0x1234567890123456789012345678901234567890',
                collateralToken: '0xA0b86a33E6441b8435b662Ad4C8fe0Cc8f8CCC5c',
                debtToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                collateralAmount: '1000000000000000000',
                price: '2000000000000000000'
            };

            const order2Data = {
                owner: '0x9876543210987654321098765432109876543210',
                collateralToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                debtToken: '0xA0b86a33E6441b8435b662Ad4C8fe0Cc8f8CCC5c',
                collateralAmount: '500000000000000000',
                price: '1500000000000000000'
            };

            // 先创建第一个订单
            await new Order(order1Data).save();

            // 稍微延迟后创建第二个订单，确保时间戳不同
            await new Promise(resolve => setTimeout(resolve, 10));
            await new Order(order2Data).save();

            const response = await request(app)
                .get('/api/orders/list')
                .expect(200);

            expect(response.body).toHaveLength(2);
            expect(response.body[0]).toMatchObject(order2Data); // 最新的订单应该在前面
            expect(response.body[1]).toMatchObject(order1Data);
        });

        it('should return orders with all expected fields', async () => {
            const orderData = {
                owner: '0x1234567890123456789012345678901234567890',
                collateralToken: '0xA0b86a33E6441b8435b662Ad4C8fe0Cc8f8CCC5c',
                debtToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                collateralAmount: '1000000000000000000',
                price: '2000000000000000000',
                status: 'FILLED',
                filledAmount: '500000000000000000'
            };

            await new Order(orderData).save();

            const response = await request(app)
                .get('/api/orders/list')
                .expect(200);

            expect(response.body).toHaveLength(1);
            const order = response.body[0];
            expect(order).toHaveProperty('_id');
            expect(order).toHaveProperty('owner', orderData.owner);
            expect(order).toHaveProperty('collateralToken', orderData.collateralToken);
            expect(order).toHaveProperty('debtToken', orderData.debtToken);
            expect(order).toHaveProperty('collateralAmount', orderData.collateralAmount);
            expect(order).toHaveProperty('price', orderData.price);
            expect(order).toHaveProperty('status', orderData.status);
            expect(order).toHaveProperty('filledAmount', orderData.filledAmount);
            expect(order).toHaveProperty('createdAt');
            expect(order).toHaveProperty('updatedAt');
        });
    });

    describe('POST /api/orders/fill', () => {
        beforeEach(async () => {
            // 为每个fillOrder测试设置一些测试订单
            const order1 = new Order({
                owner: '0x1234567890123456789012345678901234567890',
                collateralToken: '0xA0b86a33E6441b8435b662Ad4C8fe0Cc8f8CCC5c', // tokenOut
                debtToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // tokenIn
                collateralAmount: '1000000000000000000', // 1 token
                price: '2000000000000000000', // 2.0 价格
                status: 'OPEN',
                filledAmount: '0'
            });

            const order2 = new Order({
                owner: '0x9876543210987654321098765432109876543210',
                collateralToken: '0xA0b86a33E6441b8435b662Ad4C8fe0Cc8f8CCC5c', // tokenOut
                debtToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // tokenIn
                collateralAmount: '2000000000000000000', // 2 tokens
                price: '1800000000000000000', // 1.8 价格 (更好的价格)
                status: 'OPEN',
                filledAmount: '0'
            });

            await order1.save();
            await order2.save();
        });

        it('should successfully fill orders with valid parameters', async () => {
            const fillData = {
                tokenIn: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                tokenOut: '0xA0b86a33E6441b8435b662Ad4C8fe0Cc8f8CCC5c',
                amountIn: '1000000000000000000', // 1 token
                minAmountOut: '500000000000000000'  // 0.5 token
            };

            const response = await request(app)
                .post('/api/orders/fill')
                .send(fillData)
                .expect(200);

            expect(response.body).toHaveProperty('totalIn');
            expect(response.body).toHaveProperty('totalOut');
            expect(response.body).toHaveProperty('matchDetails');
            expect(response.body).toHaveProperty('swapNetAmountOut');
            expect(response.body).toHaveProperty('swapTotalInputAmount');

            expect(response.body.matchDetails).toHaveLength(1);
            expect(BigInt(response.body.totalOut)).toBeGreaterThanOrEqual(BigInt(fillData.minAmountOut));

            // 验证Web3合约调用
            expect(mockWeb3.eth.Contract).toHaveBeenCalled();
            expect(mockContractMethods.swap).toHaveBeenCalled();
        });

        it('should handle partial fills correctly', async () => {
            const fillData = {
                tokenIn: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                tokenOut: '0xA0b86a33E6441b8435b662Ad4C8fe0Cc8f8CCC5c',
                amountIn: '10000000000000000000', // 10 tokens (大于所有订单总和)
                minAmountOut: '2500000000000000000'   // 2.5 tokens
            };

            const response = await request(app)
                .post('/api/orders/fill')
                .send(fillData)
                .expect(200);

            expect(response.body.matchDetails).toHaveLength(2); // 应该匹配到两个订单
            expect(BigInt(response.body.totalOut)).toBe(BigInt('3000000000000000000')); // 总共3个token可用

            // 检查订单状态更新
            const orders = await Order.find().sort({ price: 1 });
            expect(orders[0].status).toBe('FILLED'); // 第一个订单应该完全成交
            expect(orders[1].status).toBe('FILLED'); // 第二个订单也应该完全成交
        });

        it('should fail when insufficient liquidity', async () => {
            const fillData = {
                tokenIn: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                tokenOut: '0xA0b86a33E6441b8435b662Ad4C8fe0Cc8f8CCC5c',
                amountIn: '1000000000000000000',
                minAmountOut: '5000000000000000000' // 要求5个token，但只有3个可用
            };

            const response = await request(app)
                .post('/api/orders/fill')
                .send(fillData)
                .expect(400);

            expect(response.body.message).toContain('Not enough liquidity');
            expect(response.body).toHaveProperty('matchDetails');
        });

        it('should fail validation with missing parameters', async () => {
            const incompleteData = {
                tokenIn: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                tokenOut: '0xA0b86a33E6441b8435b662Ad4C8fe0Cc8f8CCC5c'
                // 缺少 amountIn 和 minAmountOut
            };

            const response = await request(app)
                .post('/api/orders/fill')
                .send(incompleteData)
                .expect(400);

            expect(response.body.message).toBe('Missing parameters');
        });

        it('should handle no matching orders', async () => {
            const fillData = {
                tokenIn: '0xDifferentToken1234567890123456789012345678', // 不存在的token
                tokenOut: '0xAnotherToken1234567890123456789012345678',
                amountIn: '1000000000000000000',
                minAmountOut: '100000000000000000'
            };

            const response = await request(app)
                .post('/api/orders/fill')
                .send(fillData)
                .expect(400);

            expect(response.body.message).toContain('Not enough liquidity');
            expect(response.body.matchDetails).toHaveLength(0);
        });

        it('should prioritize orders by price then time', async () => {
            // 清除现有订单
            await Order.deleteMany({});

            // 创建多个订单，价格不同
            const orders = [
                {
                    owner: '0x1111111111111111111111111111111111111111',
                    collateralToken: '0xA0b86a33E6441b8435b662Ad4C8fe0Cc8f8CCC5c',
                    debtToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                    collateralAmount: '1000000000000000000',
                    price: '2200000000000000000', // 最高价格
                    status: 'OPEN'
                },
                {
                    owner: '0x2222222222222222222222222222222222222222',
                    collateralToken: '0xA0b86a33E6441b8435b662Ad4C8fe0Cc8f8CCC5c',
                    debtToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                    collateralAmount: '1000000000000000000',
                    price: '1800000000000000000', // 最低价格，应该优先匹配
                    status: 'OPEN'
                },
                {
                    owner: '0x3333333333333333333333333333333333333333',
                    collateralToken: '0xA0b86a33E6441b8435b662Ad4C8fe0Cc8f8CCC5c',
                    debtToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                    collateralAmount: '1000000000000000000',
                    price: '2000000000000000000', // 中等价格
                    status: 'OPEN'
                }
            ];

            for (const orderData of orders) {
                await new Order(orderData).save();
                await new Promise(resolve => setTimeout(resolve, 10)); // 确保时间戳不同
            }

            const fillData = {
                tokenIn: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                tokenOut: '0xA0b86a33E6441b8435b662Ad4C8fe0Cc8f8CCC5c',
                amountIn: '600000000000000000', // 只够填充一个订单
                minAmountOut: '300000000000000000'
            };

            const response = await request(app)
                .post('/api/orders/fill')
                .send(fillData)
                .expect(200);

            expect(response.body.matchDetails).toHaveLength(1);
            // 应该匹配到最低价格的订单
            expect(response.body.matchDetails[0].price).toBe('1800000000000000000');
        });

        it('should handle contract call failure gracefully', async () => {
            // Mock合约调用失败
            mockContractMethods.swap.mockReturnValue({
                call: jest.fn().mockRejectedValue(new Error('Contract call failed'))
            });

            const fillData = {
                tokenIn: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                tokenOut: '0xA0b86a33E6441b8435b662Ad4C8fe0Cc8f8CCC5c',
                amountIn: '1000000000000000000',
                minAmountOut: '500000000000000000'
            };

            const response = await request(app)
                .post('/api/orders/fill')
                .send(fillData)
                .expect(500);

            expect(response.body.message).toContain('Contract call failed');
        });
    });
});
