const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const orderRoutes = require('../../routes/orderRoutes');
const Order = require('../../models/Order');

// Mock Web3 和相关模块
jest.mock('web3');
jest.mock('../../config/appConfig', () => require('../../__mocks__/appConfig'));
jest.mock('../../abis/IRouterAbi.json', () => require('../../__mocks__/IRouterAbi.json'));

const Web3 = require('web3');
const { mockWeb3, mockContractMethods } = require('../../__mocks__/web3');

// 创建完整的测试应用（模拟index.js）
const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/orders', orderRoutes);

describe('Integration Tests - Full Order Flow', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockContractMethods.swap.mockReturnValue({
            call: jest.fn().mockResolvedValue(['1000000000000000000', '900000000000000000'])
        });
    });

    describe('Complete order lifecycle', () => {
        it('should create, list, and fill orders in sequence', async () => {
            // Step 1: 创建第一个订单
            const order1Data = {
                owner: '0x1234567890123456789012345678901234567890',
                collateralToken: '0xA0b86a33E6441b8435b662Ad4C8fe0Cc8f8CCC5c',
                debtToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                collateralAmount: '1000000000000000000',
                price: '2000000000000000000'
            };

            const createResponse1 = await request(app)
                .post('/api/orders/create')
                .send(order1Data)
                .expect(201);

            expect(createResponse1.body).toMatchObject(order1Data);

            // Step 2: 创建第二个订单
            const order2Data = {
                owner: '0x9876543210987654321098765432109876543210',
                collateralToken: '0xA0b86a33E6441b8435b662Ad4C8fe0Cc8f8CCC5c',
                debtToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                collateralAmount: '2000000000000000000',
                price: '1800000000000000000' // 更好的价格
            };

            const createResponse2 = await request(app)
                .post('/api/orders/create')
                .send(order2Data)
                .expect(201);

            expect(createResponse2.body).toMatchObject(order2Data);

            // Step 3: 列出所有订单
            const listResponse = await request(app)
                .get('/api/orders/list')
                .expect(200);

            expect(listResponse.body).toHaveLength(2);
            expect(listResponse.body[0]).toMatchObject(order2Data); // 最新的在前面
            expect(listResponse.body[1]).toMatchObject(order1Data);

            // Step 4: 执行订单撮合
            const fillData = {
                tokenIn: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                tokenOut: '0xA0b86a33E6441b8435b662Ad4C8fe0Cc8f8CCC5c',
                amountIn: '1500000000000000000', // 1.5 tokens
                minAmountOut: '800000000000000000'  // 0.8 tokens
            };

            const fillResponse = await request(app)
                .post('/api/orders/fill')
                .send(fillData)
                .expect(200);

            expect(fillResponse.body).toHaveProperty('totalIn');
            expect(fillResponse.body).toHaveProperty('totalOut');
            expect(fillResponse.body).toHaveProperty('matchDetails');
            expect(fillResponse.body.matchDetails).toHaveLength(1); // 应该匹配到价格更好的订单

            // Step 5: 验证订单状态更新
            const updatedListResponse = await request(app)
                .get('/api/orders/list')
                .expect(200);

            const filledOrder = updatedListResponse.body.find(order => order.price === '1800000000000000000');
            expect(filledOrder.status).toBe('FILLED');
            expect(BigInt(filledOrder.filledAmount)).toBeGreaterThan(BigInt('0'));

            // Step 6: 验证Web3合约调用
            expect(mockWeb3.eth.Contract).toHaveBeenCalled();
            expect(mockContractMethods.swap).toHaveBeenCalled();
        });

        it('should handle multiple partial fills', async () => {
            // 创建大订单
            const largeOrderData = {
                owner: '0x1234567890123456789012345678901234567890',
                collateralToken: '0xA0b86a33E6441b8435b662Ad4C8fe0Cc8f8CCC5c',
                debtToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                collateralAmount: '5000000000000000000', // 5 tokens
                price: '2000000000000000000'
            };

            await request(app)
                .post('/api/orders/create')
                .send(largeOrderData)
                .expect(201);

            // 第一次部分成交
            const fillData1 = {
                tokenIn: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                tokenOut: '0xA0b86a33E6441b8435b662Ad4C8fe0Cc8f8CCC5c',
                amountIn: '2000000000000000000', // 2 tokens
                minAmountOut: '900000000000000000'  // 0.9 tokens
            };

            const fillResponse1 = await request(app)
                .post('/api/orders/fill')
                .send(fillData1)
                .expect(200);

            expect(fillResponse1.body.matchDetails).toHaveLength(1);

            // 验证订单部分成交
            let listResponse = await request(app)
                .get('/api/orders/list')
                .expect(200);

            let order = listResponse.body[0];
            expect(order.status).toBe('OPEN'); // 还未完全成交
            expect(BigInt(order.filledAmount)).toBeGreaterThan(BigInt('0'));
            expect(BigInt(order.filledAmount)).toBeLessThan(BigInt(order.collateralAmount));

            // 第二次成交剩余部分
            const fillData2 = {
                tokenIn: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                tokenOut: '0xA0b86a33E6441b8435b662Ad4C8fe0Cc8f8CCC5c',
                amountIn: '10000000000000000000', // 大于剩余数量
                minAmountOut: '1000000000000000000'
            };

            const fillResponse2 = await request(app)
                .post('/api/orders/fill')
                .send(fillData2)
                .expect(200);

            // 验证订单完全成交
            listResponse = await request(app)
                .get('/api/orders/list')
                .expect(200);

            order = listResponse.body[0];
            expect(order.status).toBe('FILLED'); // 现在应该完全成交
            expect(order.filledAmount).toBe(order.collateralAmount);
        });

        it('should handle cross-token pair scenarios', async () => {
            // 创建不同token对的订单
            const ethUsdcOrder = {
                owner: '0x1111111111111111111111111111111111111111',
                collateralToken: '0xETH_ADDRESS_HERE',
                debtToken: '0xUSDC_ADDRESS_HERE',
                collateralAmount: '1000000000000000000',
                price: '3000000000'
            };

            const usdcEthOrder = {
                owner: '0x2222222222222222222222222222222222222222',
                collateralToken: '0xUSDC_ADDRESS_HERE',
                debtToken: '0xETH_ADDRESS_HERE',
                collateralAmount: '3000000000',
                price: '333333333333333'
            };

            await request(app)
                .post('/api/orders/create')
                .send(ethUsdcOrder)
                .expect(201);

            await request(app)
                .post('/api/orders/create')
                .send(usdcEthOrder)
                .expect(201);

            // 尝试匹配ETH/USDC订单
            const fillEthUsdc = {
                tokenIn: '0xUSDC_ADDRESS_HERE',
                tokenOut: '0xETH_ADDRESS_HERE',
                amountIn: '2000000000', // 2000 USDC
                minAmountOut: '500000000000000000' // 0.5 ETH
            };

            const fillResponse = await request(app)
                .post('/api/orders/fill')
                .send(fillEthUsdc)
                .expect(200);

            expect(fillResponse.body.matchDetails).toHaveLength(1);

            // 验证只有匹配的token对订单被成交
            const listResponse = await request(app)
                .get('/api/orders/list')
                .expect(200);

            const usdcEthOrderResult = listResponse.body.find(o => o.collateralToken === '0xUSDC_ADDRESS_HERE');
            const ethUsdcOrderResult = listResponse.body.find(o => o.collateralToken === '0xETH_ADDRESS_HERE');

            expect(usdcEthOrderResult.status).toBe('FILLED');
            expect(ethUsdcOrderResult.status).toBe('OPEN'); // 不匹配的订单保持开放
        });
    });

    describe('Error handling in integration scenarios', () => {
        it('should handle database connection issues gracefully', async () => {
            // 临时关闭数据库连接
            await mongoose.connection.close();

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
                .expect(500);

            expect(response.body.message).toBeDefined();

            // 重新连接数据库
            const { MongoMemoryServer } = require('mongodb-memory-server');
            const mongoServer = await MongoMemoryServer.create();
            const mongoUri = mongoServer.getUri();
            await mongoose.connect(mongoUri);
        });

        it('should handle concurrent order creation and filling', async () => {
            const orderData = {
                owner: '0x1234567890123456789012345678901234567890',
                collateralToken: '0xA0b86a33E6441b8435b662Ad4C8fe0Cc8f8CCC5c',
                debtToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                collateralAmount: '1000000000000000000',
                price: '2000000000000000000'
            };

            // 并发创建多个订单
            const createPromises = Array(5).fill().map(() =>
                request(app)
                    .post('/api/orders/create')
                    .send({
                        ...orderData,
                        owner: `0x${Math.random().toString(16).substring(2, 42).padStart(40, '0')}`
                    })
            );

            const createResponses = await Promise.all(createPromises);

            // 验证所有订单都成功创建
            createResponses.forEach(response => {
                expect(response.status).toBe(201);
            });

            // 验证数据库中确实有5个订单
            const listResponse = await request(app)
                .get('/api/orders/list')
                .expect(200);

            expect(listResponse.body).toHaveLength(5);
        });
    });

    describe('Performance and edge cases', () => {
        it('should handle large number of orders efficiently', async () => {
            // 创建100个订单
            const orderPromises = Array(100).fill().map((_, index) => {
                const orderData = {
                    owner: `0x${index.toString(16).padStart(40, '0')}`,
                    collateralToken: '0xA0b86a33E6441b8435b662Ad4C8fe0Cc8f8CCC5c',
                    debtToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                    collateralAmount: '1000000000000000000',
                    price: (2000000000000000000 + index * 1000000000000000).toString()
                };
                return new Order(orderData).save();
            });

            await Promise.all(orderPromises);

            const startTime = Date.now();

            const listResponse = await request(app)
                .get('/api/orders/list')
                .expect(200);

            const endTime = Date.now();

            expect(listResponse.body).toHaveLength(100);
            expect(endTime - startTime).toBeLessThan(1000); // 应该在1秒内完成
        });

        it('should handle very large numbers in BigInt calculations', async () => {
            const largeOrderData = {
                owner: '0x1234567890123456789012345678901234567890',
                collateralToken: '0xA0b86a33E6441b8435b662Ad4C8fe0Cc8f8CCC5c',
                debtToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                collateralAmount: '999999999999999999999999999999', // 非常大的数字
                price: '1000000000000000000'
            };

            await request(app)
                .post('/api/orders/create')
                .send(largeOrderData)
                .expect(201);

            const fillData = {
                tokenIn: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                tokenOut: '0xA0b86a33E6441b8435b662Ad4C8fe0Cc8f8CCC5c',
                amountIn: '999999999999999999999999999999',
                minAmountOut: '1'
            };

            const response = await request(app)
                .post('/api/orders/fill')
                .send(fillData)
                .expect(200);

            expect(response.body).toHaveProperty('totalIn');
            expect(response.body).toHaveProperty('totalOut');
            expect(BigInt(response.body.totalOut)).toBeGreaterThan(BigInt('0'));
        });
    });
});
