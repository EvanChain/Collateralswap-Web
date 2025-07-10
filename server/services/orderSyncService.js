const Web3 = require('web3');
const Order = require('../models/Order');
const IPIVAbi = require('../abis/IPIVAbi.json');
const { web3ProviderUrl } = require('../config/appConfig');

class OrderSyncService {
    constructor() {
        // Handle different Web3 versions
        const Web3Constructor = Web3.default || Web3;
        this.web3 = new Web3Constructor(web3ProviderUrl);
        this.pivContract = null;
        this.pivAddress = process.env.PIV_ADDRESS || 'YOUR_PIV_CONTRACT_ADDRESS';
        this.isRunning = false;
    }

    /**
     * 初始化PIV合约实例
     */
    async initContract() {
        try {
            if (!this.pivAddress || this.pivAddress === 'YOUR_PIV_CONTRACT_ADDRESS') {
                console.error('PIV contract address not configured');
                return false;
            }
            this.pivContract = new this.web3.eth.Contract(IPIVAbi, this.pivAddress);
            console.log('PIV contract initialized successfully');
            return true;
        } catch (error) {
            console.error('Failed to initialize PIV contract:', error);
            return false;
        }
    }

    /**
     * 获取链上订单总数
     */
    async getTotalOrders() {
        try {
            if (!this.pivContract) {
                throw new Error('PIV contract not initialized');
            }
            const totalOrders = await this.pivContract.methods.totalOrders().call();
            return parseInt(totalOrders);
        } catch (error) {
            console.error('Error getting total orders:', error);
            throw error;
        }
    }

    /**
     * 获取单个订单详情（模拟函数，实际需要根据合约实现）
     * 注意：IPIV.sol中没有提供直接获取订单详情的函数，
     * 这里假设有orders(uint256)函数返回订单结构
     */
    async getOrderDetails(orderId) {
        try {
            // 这里需要根据实际合约实现来调整
            // 假设有一个orders mapping可以通过orderId获取订单详情
            // 由于ABI中没有提供这个函数，这里返回模拟数据
            // 实际实现时需要监听OrderPlaced事件来获取订单详情

            console.warn(`Getting order details for orderId ${orderId} - This is a mock implementation`);
            return null; // 暂时返回null，需要实际实现
        } catch (error) {
            console.error(`Error getting order details for orderId ${orderId}:`, error);
            return null;
        }
    }

    /**
     * 通过事件日志获取订单详情
     */
    async getOrdersFromEvents() {
        try {
            if (!this.pivContract) {
                throw new Error('PIV contract not initialized');
            }

            // 获取OrderPlaced事件
            const orderPlacedEvents = await this.pivContract.getPastEvents('OrderPlaced', {
                fromBlock: 0,
                toBlock: 'latest'
            });

            // 获取OrderCancelled事件
            const orderCancelledEvents = await this.pivContract.getPastEvents('OrderCancelled', {
                fromBlock: 0,
                toBlock: 'latest'
            });

            // 获取OrderTraded事件
            const orderTradedEvents = await this.pivContract.getPastEvents('OrderTraded', {
                fromBlock: 0,
                toBlock: 'latest'
            });

            return {
                placed: orderPlacedEvents,
                cancelled: orderCancelledEvents,
                traded: orderTradedEvents
            };
        } catch (error) {
            console.error('Error getting orders from events:', error);
            throw error;
        }
    }

    /**
     * 同步订单数据
     */
    async syncOrders() {
        if (this.isRunning) {
            console.log('Sync already running, skipping...');
            return;
        }

        this.isRunning = true;
        console.log('Starting order sync...');

        try {
            // 初始化合约（如果还未初始化）
            if (!this.pivContract) {
                const initialized = await this.initContract();
                if (!initialized) {
                    console.error('Failed to initialize contract, skipping sync');
                    return;
                }
            }

            // 获取链上订单事件
            const events = await this.getOrdersFromEvents();

            // 创建订单状态映射
            const orderStatusMap = new Map();
            const orderDetailsMap = new Map();

            // 处理OrderPlaced事件
            for (const event of events.placed) {
                const { owner, orderId, collateralToken, debtToken, collateralAmount, price, interestRateMode } = event.returnValues;
                orderDetailsMap.set(orderId, {
                    owner,
                    collateralToken,
                    debtToken,
                    collateralAmount,
                    price,
                    interestRateMode,
                    status: 'OPEN',
                    filledAmount: '0'
                });
                orderStatusMap.set(orderId, 'OPEN');
            }

            // 处理OrderCancelled事件
            for (const event of events.cancelled) {
                const { orderId } = event.returnValues;
                orderStatusMap.set(orderId, 'CANCELLED');
            }

            // 处理OrderTraded事件
            for (const event of events.traded) {
                const { orderId, tradingAmount } = event.returnValues;
                if (orderDetailsMap.has(orderId)) {
                    const orderDetail = orderDetailsMap.get(orderId);
                    const currentFilled = BigInt(orderDetail.filledAmount || '0');
                    const newFilled = currentFilled + BigInt(tradingAmount);
                    orderDetail.filledAmount = newFilled.toString();

                    // 检查是否完全成交
                    if (newFilled >= BigInt(orderDetail.collateralAmount)) {
                        orderStatusMap.set(orderId, 'FILLED');
                        orderDetail.status = 'FILLED';
                    }
                }
            }

            // 获取所有链上订单ID
            const onChainOrderIds = new Set(orderDetailsMap.keys());

            // 获取数据库中的所有链上订单
            const dbOrders = await Order.find({ isFromBlockchain: true });
            const dbOrderIds = new Set(dbOrders.map(order => order.orderId));

            // 更新或创建订单
            for (const [orderId, orderDetail] of orderDetailsMap) {
                const status = orderStatusMap.get(orderId) || orderDetail.status;

                try {
                    await Order.findOneAndUpdate(
                        { orderId: orderId },
                        {
                            ...orderDetail,
                            status,
                            orderId: orderId,
                            isFromBlockchain: true,
                            updatedAt: new Date()
                        },
                        {
                            upsert: true,
                            new: true
                        }
                    );
                    console.log(`Updated/Created order ${orderId}`);
                } catch (error) {
                    console.error(`Error updating order ${orderId}:`, error);
                }
            }

            // 删除不再存在的订单
            const ordersToDelete = [...dbOrderIds].filter(id => !onChainOrderIds.has(id));
            for (const orderId of ordersToDelete) {
                try {
                    await Order.deleteOne({ orderId: orderId, isFromBlockchain: true });
                    console.log(`Deleted order ${orderId}`);
                } catch (error) {
                    console.error(`Error deleting order ${orderId}:`, error);
                }
            }

            console.log(`Sync completed. Processed ${onChainOrderIds.size} orders, deleted ${ordersToDelete.length} orders`);

        } catch (error) {
            console.error('Error during order sync:', error);
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * 启动定时同步
     */
    startScheduledSync() {
        // 立即执行一次
        this.syncOrders();

        // 每分钟执行一次
        const cron = require('node-cron');
        cron.schedule('* * * * *', () => {
            console.log('Running scheduled order sync...');
            this.syncOrders();
        });

        console.log('Order sync scheduler started (every minute)');
    }
}

module.exports = new OrderSyncService();
