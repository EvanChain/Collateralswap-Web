const Order = require('../../models/Order');

describe('Order Model', () => {
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
        expect(savedOrder.collateralToken).toBe(orderData.collateralToken);
        expect(savedOrder.debtToken).toBe(orderData.debtToken);
        expect(savedOrder.collateralAmount).toBe(orderData.collateralAmount);
        expect(savedOrder.price).toBe(orderData.price);
        expect(savedOrder.status).toBe('OPEN');
        expect(savedOrder.filledAmount).toBe('0');
        expect(savedOrder.createdAt).toBeDefined();
        expect(savedOrder.updatedAt).toBeDefined();
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
        expect(error.errors.collateralToken).toBeDefined();
        expect(error.errors.debtToken).toBeDefined();
        expect(error.errors.collateralAmount).toBeDefined();
        expect(error.errors.price).toBeDefined();
    });

    it('should only allow valid status values', async () => {
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

    it('should allow valid status values', async () => {
        const statuses = ['OPEN', 'FILLED', 'CANCELLED'];

        for (const status of statuses) {
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
});
