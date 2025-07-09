// hooks/usePivOrderBook.ts
import { useCallback } from "react";
import { ethers } from "ethers";

// 合约 ABI（只包含你需要用到的方法和事件）
const IPIV_ABI = [
    "function migrateFromAave(address collateralAtoken, uint256 atokenAmount, address debtToken, uint256 debtAmount, uint256 interestRateMode) external returns (uint256 newDebtAmount)",
    "event LoanMigrated(address indexed user, address indexed collateralToken, address indexed debtToken, uint256 collateralAmount, uint256 debtAmount, uint256 interestRateMode)"
];

const IORDERBOOK_ABI = [
    "function placeOrder(address collateralAtoken, uint256 atokenAmount, address debtToken, uint256 price) external returns (uint256 orderId)",
    "function updateOrder(uint256 orderId, uint256 atokenAmount, uint256 price) external",
    "function cancelOrder(uint256 orderId) external",
    "function swap(address tokenIn, address tokenOut, uint256 amountIn, uint256 minAmountOut, uint256[] calldata orderIds) external returns (uint256 netAmountOut)",
    "event OrderPlaced(address indexed owner, uint256 indexed orderId, address collateralToken, address debtToken, uint256 collateralAmount, uint256 price)",
    "event OrderUpdated(uint256 indexed orderId, uint256 collateralAmount, uint256 price)",
    "event OrderCancelled(uint256 indexed orderId)",
    "event OrderTraded(uint256 indexed orderId, uint256 tradingAmount)",
    "event SwapExecuted(address indexed tokenIn, address indexed tokenOut, uint256 amountIn, uint256 finalAmountOut)"
];

// 你需要替换为实际部署的合约地址
const PIV_ADDRESS = "0xYourPivContractAddress";
const ORDERBOOK_ADDRESS = "0xYourOrderBookContractAddress";

export function usePivOrderBook() {

    // 获取 provider 和 signer
    const getSigner = () => {
        if (!window.ethereum) throw new Error("MetaMask not installed");
        const provider = new ethers.BrowserProvider(window.ethereum);
        return provider.getSigner();
    };

    // IPIV 合约
    const getPivContract = async () => {
        return new ethers.Contract(PIV_ADDRESS, IPIV_ABI, await getSigner());
    };

    // IOrderBook 合约
    const getOrderBookContract = async () => {
        return new ethers.Contract(ORDERBOOK_ADDRESS, IORDERBOOK_ABI, await getSigner());
    };

    // 迁移 Aave 资产
    const migrateFromAave = useCallback(async (collateralAtoken: any | ethers.Overrides, atokenAmount: any | ethers.Overrides, debtToken: any | ethers.Overrides, debtAmount: any | ethers.Overrides, interestRateMode: any | ethers.Overrides) => {
        const contract = await getPivContract();
        const tx = await contract.migrateFromAave(collateralAtoken, atokenAmount, debtToken, debtAmount, interestRateMode);
        return tx.wait();
    }, []);

    // 迁移 Valut 资产
    const migrateFromVault = useCallback(async (collateralAtoken: any | ethers.Overrides, atokenAmount: any | ethers.Overrides, debtToken: any | ethers.Overrides, debtAmount: any | ethers.Overrides, interestRateMode: any | ethers.Overrides) => {
        const contract = await getPivContract();
        const tx = await contract.migrateFromVault(collateralAtoken, atokenAmount, debtToken, debtAmount, interestRateMode);
        return tx.wait();
    }, []);

    // 下单
    const placeOrder = useCallback(async (collateralAtoken: any | ethers.Overrides, atokenAmount: any | ethers.Overrides, debtToken: any | ethers.Overrides, price: any | ethers.Overrides) => {
        const contract = await getOrderBookContract();
        const tx = await contract.placeOrder(collateralAtoken, atokenAmount, debtToken, price);
        return tx.wait();
    }, []);

    // 更新订单
    const updateOrder = useCallback(async (orderId: any | ethers.Overrides, atokenAmount: any | ethers.Overrides, price: any | ethers.Overrides) => {
        const contract = await getOrderBookContract();
        const tx = await contract.updateOrder(orderId, atokenAmount, price);
        return tx.wait();
    }, []);

    // 取消订单
    const cancelOrder = useCallback(async (orderId: any | ethers.Overrides) => {
        const contract = await getOrderBookContract();
        const tx = await contract.cancelOrder(orderId);
        return tx.wait();
    }, []);

    // 交易订单
    const swap = useCallback(async (tokenIn: any | ethers.Overrides, tokenOut: any | ethers.Overrides, amountIn: any | ethers.Overrides, minAmountOut: any | ethers.Overrides, orderIds: any | ethers.Overrides) => {
        const contract = await getOrderBookContract();
        const tx = await contract.swap(tokenIn, tokenOut, amountIn, minAmountOut, orderIds);
        return tx.wait();
    }, []);

    return {
        migrateFromAave,
        migrateFromVault,
        placeOrder,
        updateOrder,
        cancelOrder,
        swap,
    };
}