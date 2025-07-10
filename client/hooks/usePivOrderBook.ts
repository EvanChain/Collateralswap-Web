// hooks/usePivOrderBook.ts
import { useCallback } from "react";
import { ethers } from "ethers";
import { CONTRACT_CONFIG, CONTRACT_ABIS } from "../config/appConfig";

export function usePivOrderBook() {
    // 获取 provider 和 signer
    const getSigner = () => {
        if (!window.ethereum) throw new Error("MetaMask not installed");
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        return provider.getSigner();
    };

    // IPIV 合约
    const getPivContract = async () => {
        const pivAddress = CONTRACT_CONFIG.PIV_ADDRESS;
        if (pivAddress === '0x0000000000000000000000000000000000000000') {
            throw new Error('PIV address not configured');
        }
        return new ethers.Contract(pivAddress, CONTRACT_ABIS.IPIV, await getSigner());
    };

    // 获取ADDRESSES_PROVIDER
    const getAddressesProvider = useCallback(async () => {
        const contract = await getPivContract();
        return await contract.ADDRESSES_PROVIDER();
    }, []);

    // 获取POOL
    const getPool = useCallback(async () => {
        const contract = await getPivContract();
        return await contract.POOL();
    }, []);

    // 获取总订单数
    const getTotalOrders = useCallback(async () => {
        const contract = await getPivContract();
        return await contract.totalOrders();
    }, []);

    // 获取 aToken 地址
    const getAtokenAddress = useCallback(async (asset: string) => {
        const contract = await getPivContract();
        return await contract.atokenAddress(asset);
    }, []);

    // 获取资产余额
    const getBalance = useCallback(async (token: string) => {
        const contract = await getPivContract();
        return await contract.getBalance(token);
    }, []);

    // 获取collateralOnSold
    const getCollateralOnSold = useCallback(async (address: string) => {
        const contract = await getPivContract();
        return await contract.collateralOnSold(address);
    }, []);

    // 获取订单信息
    const getOrderMapping = useCallback(async (orderId: number) => {
        const contract = await getPivContract();
        return await contract.orderMapping(orderId);
    }, []);

    // 获取合约所有者
    const getOwner = useCallback(async () => {
        const contract = await getPivContract();
        return await contract.owner();
    }, []);

    // 迁移 Aave 资产
    const migrateFromAave = useCallback(async (
        collateralToken: string,
        collateralAmount: string | number,
        debtToken: string,
        debtAmount: string | number,
        interestRateMode: number
    ) => {
        const contract = await getPivContract();
        const tx = await contract.migrateFromAave(collateralToken, collateralAmount, debtToken, debtAmount, interestRateMode);
        return tx.wait();
    }, []);

    // 下单
    const placeOrder = useCallback(async (
        collateralToken: string,
        collateralAmount: string | number,
        debtToken: string,
        price: string | number,
        interestRateMode: number
    ) => {
        const contract = await getPivContract();
        const tx = await contract.placeOrder(collateralToken, collateralAmount, debtToken, price, interestRateMode);
        return tx.wait();
    }, []);

    // 更新订单
    const updateOrder = useCallback(async (
        orderId: number,
        price: string | number
    ) => {
        const contract = await getPivContract();
        const tx = await contract.updateOrder(orderId, price);
        return tx.wait();
    }, []);

    // 取消订单
    const cancelOrder = useCallback(async (orderId: number) => {
        const contract = await getPivContract();
        const tx = await contract.cancelOrder(orderId);
        return tx.wait();
    }, []);

    // 预览交易
    const previewSwap = useCallback(async (
        orderIds: number[],
        tradingAmount: string | number
    ) => {
        const contract = await getPivContract();
        return await contract.previewSwap(orderIds, tradingAmount);
    }, []);

    // 执行交易
    const swap = useCallback(async (
        orderIds: number[],
        tradingAmount: string | number,
        recipient: string
    ) => {
        const contract = await getPivContract();
        const tx = await contract.swap(orderIds, tradingAmount, recipient);
        return tx.wait();
    }, []);

    // 转移所有权
    const transferOwnership = useCallback(async (newOwner: string) => {
        const contract = await getPivContract();
        const tx = await contract.transferOwnership(newOwner);
        return tx.wait();
    }, []);

    // 放弃所有权
    const renounceOwnership = useCallback(async () => {
        const contract = await getPivContract();
        const tx = await contract.renounceOwnership();
        return tx.wait();
    }, []);

    // 提取资产
    const withdrawAssets = useCallback(async (
        token: string,
        amount: string | number,
        recipient: string
    ) => {
        const contract = await getPivContract();
        const tx = await contract.withdrawAssets(token, amount, recipient);
        return tx.wait();
    }, []);

    return {
        getAddressesProvider,
        getPool,
        getTotalOrders,
        getAtokenAddress,
        getBalance,
        getCollateralOnSold,
        getOrderMapping,
        getOwner,
        migrateFromAave,
        placeOrder,
        updateOrder,
        cancelOrder,
        previewSwap,
        swap,
        transferOwnership,
        renounceOwnership,
        withdrawAssets,
    };
}