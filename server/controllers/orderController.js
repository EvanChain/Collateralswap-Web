const Order = require('../models/Order');
const { body, validationResult } = require('express-validator');
const Web3 = require('web3');
const IRouterAbi = require('../abis/IRouterAbi.json'); // 请确保ABI文件路径正确
const { orderBookAddress, web3ProviderUrl, pivAddress } = require('../config/appConfig');

exports.validateCreateOrder = [
    body('owner').isString().notEmpty(),
    body('collateralToken').isString().notEmpty(),
    body('debtToken').isString().notEmpty(),
    body('collateralAmount').isString().notEmpty(),
    body('price').isString().notEmpty()
];

exports.createOrder = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const order = new Order({
            owner: req.body.owner,
            collateralToken: req.body.collateralToken,
            debtToken: req.body.debtToken,
            collateralAmount: req.body.collateralAmount,
            price: req.body.price
        });

        await order.save();
        res.status(201).json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Swap撮合算法：
 * 1. 查询所有可成交订单（OPEN，token匹配，价格满足）
 * 2. 按价格优先、时间优先排序
 * 3. 依次撮合，直到amountIn用完或无可撮合订单
 * 4. 更新订单状态和已成交数量
 * 5. 返回撮合明细和成交总额
 */
exports.fillOrder = async (req, res) => {
    try {
        const { tokenIn, tokenOut, amountIn, minAmountOut } = req.body;
        if (!tokenIn || !tokenOut || !amountIn || !minAmountOut) {
            return res.status(400).json({ message: 'Missing parameters' });
        }
        let remainingIn = BigInt(amountIn);
        let totalOut = BigInt(0);
        let matchDetails = [];

        // 查询所有可成交订单（OPEN，token匹配，价格满足）
        // 这里假设订单是卖出tokenOut，买入tokenIn
        // 价格为 tokenOut/tokenIn，用户用tokenIn买tokenOut
        const orders = await Order.find({
            status: 'OPEN',
            collateralToken: tokenOut,
            debtToken: tokenIn
        }).sort({ price: 1, createdAt: 1 }); // 价格优先，时间优先

        for (const order of orders) {
            if (remainingIn === BigInt(0)) break;
            // 价格撮合判断：用户愿意用tokenIn买tokenOut，订单价格<=用户可接受价格
            // 这里假设用户愿意接受所有价格（可加参数限制）
            const orderPrice = BigInt(order.price); // 假设18位精度
            // 订单剩余可成交量
            const orderRemaining = BigInt(order.collateralAmount) - BigInt(order.filledAmount);
            // 计算本次可成交的tokenIn数量（以订单价格为基准）
            // 用户用tokenIn买tokenOut，orderPrice = tokenOut/tokenIn
            // tokenIn = tokenOut * 1e18 / price
            let maxInForOrder = orderRemaining * BigInt(1e18) / orderPrice;
            let fillIn = remainingIn < maxInForOrder ? remainingIn : maxInForOrder;
            let fillOut = fillIn * orderPrice / BigInt(1e18);
            if (fillOut > orderRemaining) fillOut = orderRemaining;
            if (fillIn === BigInt(0) || fillOut === BigInt(0)) continue;

            // 更新订单
            order.filledAmount = (BigInt(order.filledAmount) + fillOut).toString();
            if (BigInt(order.filledAmount) === BigInt(order.collateralAmount)) {
                order.status = 'FILLED';
            }
            order.updatedAt = Date.now();
            await order.save();

            matchDetails.push({
                orderId: order._id,
                fillIn: fillIn.toString(),
                fillOut: fillOut.toString(),
                price: order.price
            });
            remainingIn -= fillIn;
            totalOut += fillOut;
        }

        // // 记录撮合订单ID
        // const matchedOrderIds = matchDetails.map(d => d.orderId);

        // // 调用IRouter合约swap
        // let swapResult = null;
        // if (matchedOrderIds.length > 0) {
        //     try {
        //         // // 构造swapData参数，严格按照新的IRouter ABI结构
        //         // const swapData = {
        //         //     tokenIn: tokenIn,
        //         //     tokenOut: tokenOut,
        //         //     amountIn: amountIn.toString(),
        //         //     minAmountOut: minAmountOut.toString(),
        //         //     orderDatas: [
        //         //         {
        //         //             pivAddress: pivAddress, // 使用配置文件中的PIV地址
        //         //             orderIds: matchedOrderIds
        //         //         }
        //         //     ]
        //         // };

        //         // // 初始化 IRouter 合约实例
        //         // const web3 = new Web3(web3ProviderUrl);
        //         // const routerContract = new web3.eth.Contract(IRouterAbi, orderBookAddress);

        //         // // 调用合约swap方法，返回 [netAmountOut, totalInputAmount]
        //         // swapResult = await routerContract.methods.swap(swapData).call();

        //         // // 可选：保存swap结果到订单
        //         // for (const orderId of matchedOrderIds) {
        //         //     await Order.findByIdAndUpdate(orderId, {
        //         //         lastSwapResult: {
        //         //             netAmountOut: swapResult[0],
        //         //             totalInputAmount: swapResult[1],
        //         //             timestamp: Date.now()
        //         //         }
        //         //     });
        //         // }
        //     } catch (contractError) {
        //         console.error('IRouter contract call failed:', contractError);
        //         // 合约调用失败时继续处理，但记录错误
        //         swapResult = null;
        //     }
        // }

        if (totalOut < BigInt(minAmountOut)) {
            return res.status(400).json({ message: 'Not enough liquidity to satisfy minAmountOut', matchDetails });
        }

        res.json({
            totalIn: (BigInt(amountIn) - remainingIn).toString(),
            totalOut: totalOut.toString(),
            matchDetails,
            swapNetAmountOut: swapResult ? swapResult[0].toString() : null,
            swapTotalInputAmount: swapResult ? swapResult[1].toString() : null
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.listOrder = async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * 手动触发订单同步
 */
exports.syncOrders = async (req, res) => {
    try {
        const orderSyncService = require('../services/orderSyncService');
        await orderSyncService.syncOrders();
        res.json({ message: 'Order sync completed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Order sync failed', error: error.message });
    }
};

/**
 * 获取同步状态
 */
exports.getSyncStatus = async (req, res) => {
    try {
        const orderSyncService = require('../services/orderSyncService');
        res.json({
            isRunning: orderSyncService.isRunning,
            pivAddress: orderSyncService.pivAddress,
            contractInitialized: !!orderSyncService.pivContract
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
