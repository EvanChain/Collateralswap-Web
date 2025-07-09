const request = require('supertest');
const express = require('express');
const orderRoutes = require('../../routes/orderRoutes');
const Order = require('../../models/Order');
const TestHelpers = require('../helpers/testHelpers');

// Mock Web3
jest.mock('web3');
jest.mock('../../config/appConfig', () => require('../../__mocks__/appConfig'));
jest.mock('../../abis/IRouterAbi.json', () => require('../../__mocks__/IRouterAbi.json'));

const Web3 = require('web3');
const { mockWeb3, mockContractMethods } = require('../../__mocks__/web3');

// 创建测试应用
const app = express();
app.use(express.json());
app.use('/api/orders', orderRoutes);

describe('Performance Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockContractMethods.swap.mockReturnValue({
            call: jest.fn().mockResolvedValue(['1000000000000000000', '900000000000000000'])
        });
    });

    afterEach(async () => {
        await TestHelpers.cleanupTestData();
    });

    describe('Order Creation Performance', () => {
        it('should create orders within acceptable time limits', async () => {
            const orderCount = 50;
            const startTime = Date.now();

            const promises = Array(orderCount).fill().map((_, index) => {
                const orderData = TestHelpers.createOrderData({
                    owner: TestHelpers.generateRandomAddress(),
                    collateralAmount: TestHelpers.generateRandomAmount(),
                    price: TestHelpers.generateRandomAmount('1500000000000000000', '2500000000000000000')
                });

                return request(app)
                    .post('/api/orders/create')
                    .send(orderData);
            });

            const responses = await Promise.all(promises);
            const endTime = Date.now();
            const duration = endTime - startTime;

            // 验证所有订单都成功创建
            responses.forEach(response => {
                expect(response.status).toBe(201);
            });

            // 性能要求：50个订单应在5秒内创建完成
            expect(duration).toBeLessThan(5000);
            console.log(`Created ${orderCount} orders in ${duration}ms (${duration / orderCount}ms per order)`);
        });

        it('should handle concurrent order creation without race conditions', async () => {
            const concurrentBatches = 5;
            const ordersPerBatch = 10;

            const batchPromises = Array(concurrentBatches).fill().map(async (_, batchIndex) => {
                const orderPromises = Array(ordersPerBatch).fill().map((_, orderIndex) => {
                    const orderData = TestHelpers.createOrderData({
                        owner: TestHelpers.generateRandomAddress(),
                        collateralAmount: ((batchIndex * ordersPerBatch + orderIndex + 1) * 1000000000000000000).toString()
                    });

                    return request(app)
                        .post('/api/orders/create')
                        .send(orderData);
                });

                return Promise.all(orderPromises);
            });

            const allResponses = await Promise.all(batchPromises);

            // 验证所有订单都成功创建
            allResponses.forEach(batchResponses => {
                batchResponses.forEach(response => {
                    expect(response.status).toBe(201);
                });
            });

            // 验证数据库中有正确数量的订单
            const totalOrders = await Order.countDocuments();
            expect(totalOrders).toBe(concurrentBatches * ordersPerBatch);
        });
    });

    describe('Order Listing Performance', () => {
        it('should list large number of orders efficiently', async () => {
            const orderCount = 200;

            // 创建大量订单
            await TestHelpers.createPerformanceTestData(orderCount);

            const startTime = Date.now();

            const response = await request(app)
                .get('/api/orders/list')
                .expect(200);

            const endTime = Date.now();
            const duration = endTime - startTime;

            expect(response.body).toHaveLength(orderCount);
            expect(duration).toBeLessThan(2000); // 应在2秒内完成

            // 验证订单按创建时间降序排列
            for (let i = 1; i < response.body.length; i++) {
                const currentTime = new Date(response.body[i].createdAt).getTime();
                const previousTime = new Date(response.body[i - 1].createdAt).getTime();
                expect(currentTime).toBeLessThanOrEqual(previousTime);
            }

            console.log(`Listed ${orderCount} orders in ${duration}ms`);
        });

        it('should handle pagination efficiently when implemented', async () => {
            const orderCount = 1000;
            await TestHelpers.createPerformanceTestData(orderCount);

            const startTime = Date.now();

            // 即使没有分页，也应该快速返回
            const response = await request(app)
                .get('/api/orders/list')
                .expect(200);

            const endTime = Date.now();
            const duration = endTime - startTime;

            expect(response.body).toHaveLength(orderCount);
            expect(duration).toBeLessThan(5000); // 1000个订单应在5秒内完成

            console.log(`Listed ${orderCount} orders in ${duration}ms`);
        });
    });

    describe('Order Filling Performance', () => {
        it('should efficiently match orders in optimal price order', async () => {
            const orderCount = 100;

            // 创建具有不同价格的订单
            const orders = await TestHelpers.createMultipleOrders(orderCount, {
                collateralToken: '0xA0b86a33E6441b8435b662Ad4C8fe0Cc8f8CCC5c',
                debtToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                collateralAmount: '1000000000000000000',
                status: 'OPEN'
            });

            const fillData = TestHelpers.createFillData({
                amountIn: '50000000000000000000', // 足够匹配多个订单
                minAmountOut: '20000000000000000000'
            });

            const startTime = Date.now();

            const response = await request(app)
                .post('/api/orders/fill')
                .send(fillData)
                .expect(200);

            const endTime = Date.now();
            const duration = endTime - startTime;

            expect(response.body.matchDetails.length).toBeGreaterThan(0);
            expect(duration).toBeLessThan(3000); // 应在3秒内完成匹配

            // 验证匹配顺序正确（价格从低到高）
            for (let i = 1; i < response.body.matchDetails.length; i++) {
                const currentPrice = BigInt(response.body.matchDetails[i].price);
                const previousPrice = BigInt(response.body.matchDetails[i - 1].price);
                expect(currentPrice).toBeGreaterThanOrEqual(previousPrice);
            }

            console.log(`Matched ${response.body.matchDetails.length} orders in ${duration}ms`);
        });

        it('should handle complex matching scenarios efficiently', async () => {
            // 创建复杂的订单场景
            const scenarios = [
                { collateralAmount: '100000000000000000', price: '2000000000000000000' }, // 小订单，高价
                { collateralAmount: '5000000000000000000', price: '1800000000000000000' }, // 大订单，低价
                { collateralAmount: '1000000000000000000', price: '1900000000000000000' }, // 中等订单，中等价格
                { collateralAmount: '10000000000000000000', price: '1700000000000000000' }, // 大订单，最低价
            ];

            for (const scenario of scenarios) {
                for (let i = 0; i < 25; i++) { // 每种场景创建25个订单
                    await new Order(TestHelpers.createOrderData({
                        owner: TestHelpers.generateRandomAddress(),
                        ...scenario
                    })).save();
                }
            }

            const fillData = TestHelpers.createFillData({
                amountIn: '100000000000000000000', // 大量输入
                minAmountOut: '50000000000000000000'
            });

            const startTime = Date.now();

            const response = await request(app)
                .post('/api/orders/fill')
                .send(fillData)
                .expect(200);

            const endTime = Date.now();
            const duration = endTime - startTime;

            expect(response.body.matchDetails.length).toBeGreaterThan(0);
            expect(duration).toBeLessThan(5000); // 复杂匹配应在5秒内完成

            console.log(`Complex matching completed in ${duration}ms with ${response.body.matchDetails.length} matches`);
        });
    });

    describe('Memory and Resource Usage', () => {
        it('should handle large data sets without memory leaks', async () => {
            const initialMemory = process.memoryUsage().heapUsed;

            // 创建和处理大量数据
            for (let batch = 0; batch < 10; batch++) {
                await TestHelpers.createPerformanceTestData(100);

                await request(app)
                    .get('/api/orders/list')
                    .expect(200);

                const fillData = TestHelpers.createFillData({
                    amountIn: '10000000000000000000',
                    minAmountOut: '1000000000000000000'
                });

                await request(app)
                    .post('/api/orders/fill')
                    .send(fillData);

                // 清理数据
                await TestHelpers.cleanupTestData();

                // 强制垃圾回收（如果可用）
                if (global.gc) {
                    global.gc();
                }
            }

            const finalMemory = process.memoryUsage().heapUsed;
            const memoryIncrease = finalMemory - initialMemory;

            // 内存增长应该在合理范围内（小于50MB）
            expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);

            console.log(`Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
        });
    });

    describe('Stress Tests', () => {
        it('should handle high load scenarios', async () => {
            // 创建基础订单数据
            await TestHelpers.createPerformanceTestData(200);

            const concurrentRequests = 20;
            const requestsPerType = 10;

            const allPromises = [];

            // 并发的创建请求
            for (let i = 0; i < requestsPerType; i++) {
                allPromises.push(
                    request(app)
                        .post('/api/orders/create')
                        .send(TestHelpers.createOrderData({
                            owner: TestHelpers.generateRandomAddress()
                        }))
                );
            }

            // 并发的列表请求
            for (let i = 0; i < requestsPerType; i++) {
                allPromises.push(
                    request(app)
                        .get('/api/orders/list')
                );
            }

            // 并发的填充请求
            for (let i = 0; i < requestsPerType; i++) {
                allPromises.push(
                    request(app)
                        .post('/api/orders/fill')
                        .send(TestHelpers.createFillData({
                            amountIn: TestHelpers.generateRandomAmount('1000000000000000000', '5000000000000000000')
                        }))
                );
            }

            const startTime = Date.now();
            const responses = await Promise.allSettled(allPromises);
            const endTime = Date.now();
            const duration = endTime - startTime;

            // 计算成功率
            const successful = responses.filter(r => r.status === 'fulfilled' &&
                (r.value.status === 200 || r.value.status === 201)).length;
            const successRate = successful / responses.length;

            expect(successRate).toBeGreaterThan(0.9); // 90%以上成功率
            expect(duration).toBeLessThan(10000); // 10秒内完成

            console.log(`Stress test: ${successful}/${responses.length} requests successful in ${duration}ms`);
            console.log(`Success rate: ${(successRate * 100).toFixed(2)}%`);
        });
    });
});
