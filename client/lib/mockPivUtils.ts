// Mock PIV contract utilities for development
import { ethers } from 'ethers';
import { MOCK_CONFIG, mockLog, mockDelay, mockDataStore, PivPosition } from './mockData';
import { CONTRACT_CONFIG } from '../config/appConfig';

export interface PivOrder {
    id: string;
    owner: string;
    collateralToken: string;
    debtToken: string;
    collateralAmount: string;
    price: string;
    status: 'OPEN' | 'FILLED' | 'CANCELLED';
}

export class MockPivUtils {
    private contractAddress: string;

    constructor() {
        this.contractAddress = CONTRACT_CONFIG.PIV_ADDRESS;
    }

    // Get PIV positions for a user
    async getUserPivPositions(userAddress: string): Promise<PivPosition[]> {
        mockLog('PIV', 'Getting user PIV positions', { userAddress });
        await mockDelay();

        // Filter positions by user (in real implementation, this would be contract-based)
        return mockDataStore.getPivPositions().filter(pos =>
            pos.id.includes(userAddress.toLowerCase()) || true // For demo, return all
        );
    }

    // Create a new PIV order
    async createOrder(
        owner: string,
        collateralToken: string,
        debtToken: string,
        collateralAmount: string,
        price: string
    ): Promise<{ success: boolean; orderId?: string; error?: string }> {
        mockLog('PIV', 'Creating PIV order', {
            owner,
            collateralToken,
            debtToken,
            collateralAmount,
            price
        });

        await mockDelay();

        try {
            // Simulate order creation
            const orderId = `PIV_${Date.now()}`;

            // Create corresponding PIV position
            const pivPosition: PivPosition = {
                id: `piv-${collateralToken.toLowerCase()}-${Date.now()}`,
                type: 'collateral',
                token: collateralToken,
                amount: ethers.utils.parseUnits(collateralAmount, 18).toString(),
                formattedAmount: collateralAmount,
                tokenAddress: this.getTokenAddress(collateralToken),
                orderId: orderId,
            };

            mockDataStore.addPivPosition(pivPosition);

            return {
                success: true,
                orderId: orderId
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    // Fill an existing order
    async fillOrder(
        orderId: string,
        fillAmount: string
    ): Promise<{ success: boolean; error?: string }> {
        mockLog('PIV', 'Filling PIV order', { orderId, fillAmount });
        await mockDelay();

        try {
            // In real implementation, this would interact with the PIV contract
            return {
                success: true
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    // Cancel an order
    async cancelOrder(orderId: string): Promise<{ success: boolean; error?: string }> {
        mockLog('PIV', 'Cancelling PIV order', { orderId });
        await mockDelay();

        try {
            return {
                success: true
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    // Get all orders from the contract
    async getAllOrders(): Promise<PivOrder[]> {
        mockLog('PIV', 'Getting all PIV orders');
        await mockDelay();

        // Convert stored orders to PIV format
        const orders = mockDataStore.getOrders();
        return orders.map(order => ({
            id: order._id,
            owner: order.owner,
            collateralToken: order.collateralToken,
            debtToken: order.debtToken,
            collateralAmount: order.collateralAmount,
            price: order.price,
            status: order.status,
        }));
    }

    // Get orders for a specific user
    async getUserOrders(userAddress: string): Promise<PivOrder[]> {
        mockLog('PIV', 'Getting user PIV orders', { userAddress });
        await mockDelay();

        const allOrders = await this.getAllOrders();
        return allOrders.filter(order =>
            order.owner.toLowerCase() === userAddress.toLowerCase()
        );
    }

    // Helper method to get token address
    private getTokenAddress(symbol: string): string {
        const tokenAddresses: Record<string, string> = {
            'ETH': '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
            'WBTC': '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
            'USDC': '0xA0b86a33E6441A3063BdFb663c6C8FAc6C8A4Ec2',
            'USDT': '0xdAC17F958D2ee523a2206206994597C13D831ec7',
            'DAI': '0x6B175474E89094C44Da98b954EedeAC495271d0F',
            'LINK': '0x514910771AF9Ca656af840dff83E8264EcF986CA',
            'AAVE': '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
        };
        return tokenAddresses[symbol] || '0x0000000000000000000000000000000000000000';
    }
}

// Factory function for PIV utils
export const getPivUtils = async (): Promise<MockPivUtils | null> => {
    try {
        if (MOCK_CONFIG.GLOBAL_MOCK_MODE || MOCK_CONFIG.USE_MOCK_CONTRACTS) {
            mockLog('PIV', 'Creating mock PIV utils instance');
            return new MockPivUtils();
        }

        // In real implementation, this would create actual contract interfaces
        mockLog('PIV', 'Mock mode disabled - would create real PIV contract interface');
        return new MockPivUtils(); // For now, always return mock
    } catch (error) {
        console.error('Error creating PIV utils:', error);
        return null;
    }
};

export default MockPivUtils;
