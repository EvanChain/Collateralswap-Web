import { useCallback } from "react";
import { ethers } from "ethers";
import { CONTRACT_CONFIG, CONTRACT_ABIS } from "../config/appConfig";

export function useIRouter() {
    // Get provider and signer
    const getSigner = async () => {
        if (!window.ethereum) throw new Error("MetaMask not installed");
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        return provider.getSigner();
    };

    // Get Router contract instance
    const getRouterContract = async () => {
        const routerAddress = CONTRACT_CONFIG.ROUTER_ADDRESS;
        if (routerAddress === '0x0000000000000000000000000000000000000000') {
            throw new Error('Router address not configured');
        }
        return new ethers.Contract(routerAddress, CONTRACT_ABIS.IROUTER, await getSigner());
    };

    // Get ADDRESSES_PROVIDER
    const getAddressesProvider = useCallback(async () => {
        const contract = await getRouterContract();
        return await contract.ADDRESSES_PROVIDER();
    }, []);

    // Get POOL
    const getPool = useCallback(async () => {
        const contract = await getRouterContract();
        return await contract.POOL();
    }, []);

    // Deploy PIV
    const deployPIV = useCallback(async () => {
        const contract = await getRouterContract();
        const tx = await contract.deployPIV();
        return tx.wait();
    }, []);

    // IRouter contract swap method
    const swapWithRouter = useCallback(async (swapData: {
        tokenIn: string;
        tokenOut: string;
        amountIn: string;
        minAmountOut: string;
        orderDatas: Array<{
            pivAddress: string;
            orderIds: number[];
        }>;
    }) => {
        try {
            const contract = await getRouterContract();

            // Call swap method with the correct structure
            const tx = await contract.swap(swapData);
            const receipt = await tx.wait();

            // Parse the SwapExecuted event
            const swapEvent = receipt.logs.find((log: any) => {
                try {
                    const parsed = contract.interface.parseLog(log);
                    return parsed?.name === 'SwapExecuted';
                } catch {
                    return false;
                }
            });

            let finalAmountOut = '0';
            if (swapEvent) {
                const parsed = contract.interface.parseLog(swapEvent);
                finalAmountOut = parsed?.args?.finalAmountOut?.toString() || '0';
            }

            return {
                netAmountOut: finalAmountOut,
                totalInputAmount: swapData.amountIn,
                transactionHash: receipt.hash
            };
        } catch (error) {
            console.error('Router swap failed:', error);
            throw error;
        }
    }, []);

    return {
        getAddressesProvider,
        getPool,
        deployPIV,
        swapWithRouter,
    };
}
