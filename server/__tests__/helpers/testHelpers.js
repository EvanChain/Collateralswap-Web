const Order = require('../../models/Order');

/**
 * 测试工具函数集合
 */
class TestHelpers {
    /**
     * 创建测试订单数据
     */
    static createOrderData(overrides = {}) {
        return {
            owner: '0x1234567890123456789012345678901234567890',
            collateralToken: '0xA0b86a33E6441b8435b662Ad4C8fe0Cc8f8CCC5c',
            debtToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
            collateralAmount: '1000000000000000000',
            price: '2000000000000000000',
            status: 'OPEN',
            filledAmount: '0',
            ...overrides
        };
    }

    /**
     * 创建多个测试订单
     */
    static async createMultipleOrders(count, baseData = {}) {
        const orders = [];
        for (let i = 0; i < count; i++) {
            const orderData = this.createOrderData({
                owner: `0x${i.toString(16).padStart(40, '0')}`,
                price: (BigInt('2000000000000000000') + BigInt(i) * BigInt('100000000000000000')).toString(),
                ...baseData
            });
            const order = await new Order(orderData).save();
            orders.push(order);
        }
        return orders;
    }

    /**
     * 创建填充订单数据
     */
    static createFillData(overrides = {}) {
        return {
            tokenIn: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
            tokenOut: '0xA0b86a33E6441b8435b662Ad4C8fe0Cc8f8CCC5c',
            amountIn: '1000000000000000000',
            minAmountOut: '500000000000000000',
            ...overrides
        };
    }

    /**
     * 生成随机地址
     */
    static generateRandomAddress() {
        return '0x' + Array(40).fill().map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    }

    /**
     * 生成随机BigInt字符串
     */
    static generateRandomAmount(min = '1000000000000000000', max = '10000000000000000000') {
        const minBig = BigInt(min);
        const maxBig = BigInt(max);
        const range = maxBig - minBig;
        const randomBig = minBig + BigInt(Math.floor(Math.random() * Number(range)));
        return randomBig.toString();
    }

    /**
     * 等待指定毫秒
     */
    static async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 验证订单对象结构
     */
    static validateOrderStructure(order) {
        expect(order).toHaveProperty('_id');
        expect(order).toHaveProperty('owner');
        expect(order).toHaveProperty('collateralToken');
        expect(order).toHaveProperty('debtToken');
        expect(order).toHaveProperty('collateralAmount');
        expect(order).toHaveProperty('price');
        expect(order).toHaveProperty('status');
        expect(order).toHaveProperty('filledAmount');
        expect(order).toHaveProperty('createdAt');
        expect(order).toHaveProperty('updatedAt');

        expect(['OPEN', 'FILLED', 'CANCELLED']).toContain(order.status);
        expect(BigInt(order.filledAmount)).toBeGreaterThanOrEqual(BigInt('0'));
        expect(BigInt(order.filledAmount)).toBeLessThanOrEqual(BigInt(order.collateralAmount));
    }

    /**
     * 验证填充响应结构
     */
    static validateFillResponse(response) {
        expect(response).toHaveProperty('totalIn');
        expect(response).toHaveProperty('totalOut');
        expect(response).toHaveProperty('matchDetails');
        expect(response).toHaveProperty('swapNetAmountOut');
        expect(response).toHaveProperty('swapTotalInputAmount');

        expect(Array.isArray(response.matchDetails)).toBe(true);

        response.matchDetails.forEach(detail => {
            expect(detail).toHaveProperty('orderId');
            expect(detail).toHaveProperty('fillIn');
            expect(detail).toHaveProperty('fillOut');
            expect(detail).toHaveProperty('price');
        });
    }

    /**
     * 模拟BigInt计算
     */
    static calculateExpectedOutput(amountIn, price) {
        // 模拟合约中的计算逻辑
        // amountOut = amountIn * 1e18 / price
        return (BigInt(amountIn) * BigInt('1000000000000000000') / BigInt(price)).toString();
    }

    /**
     * 清理所有测试数据
     */
    static async cleanupTestData() {
        await Order.deleteMany({});
    }

    /**
     * 创建性能测试场景
     */
    static async createPerformanceTestData(orderCount = 100) {
        const orders = [];
        const batchSize = 10;

        for (let i = 0; i < orderCount; i += batchSize) {
            const batch = [];
            for (let j = 0; j < batchSize && (i + j) < orderCount; j++) {
                const orderData = this.createOrderData({
                    owner: this.generateRandomAddress(),
                    collateralAmount: this.generateRandomAmount(),
                    price: this.generateRandomAmount('1500000000000000000', '2500000000000000000')
                });
                batch.push(orderData);
            }

            const savedBatch = await Order.insertMany(batch);
            orders.push(...savedBatch);
        }

        return orders;
    }
}

module.exports = TestHelpers;
