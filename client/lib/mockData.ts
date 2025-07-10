// Global mock configuration and data for development
import { AavePosition } from './aaveUtils';
import { Order } from './api';

// Mock configuration flags
export const MOCK_CONFIG = {
    // Global mock mode - when true, all data comes from mocks
    GLOBAL_MOCK_MODE: process.env.NEXT_PUBLIC_MOCK_MODE === 'true',

    // Individual service mocks
    USE_MOCK_AAVE: process.env.NEXT_PUBLIC_USE_MOCK_AAVE === 'true',
    USE_MOCK_API: process.env.NEXT_PUBLIC_USE_MOCK_API === 'true',
    USE_MOCK_CONTRACTS: process.env.NEXT_PUBLIC_USE_MOCK_CONTRACTS === 'true',

    // Development helpers
    ENABLE_MOCK_LOGS: true,
    MOCK_DELAY_MS: 800, // Simulate network delay
};

// Check if any mock is enabled
export const isMockMode = () => {
    return MOCK_CONFIG.GLOBAL_MOCK_MODE ||
        MOCK_CONFIG.USE_MOCK_AAVE ||
        MOCK_CONFIG.USE_MOCK_API ||
        MOCK_CONFIG.USE_MOCK_CONTRACTS;
};

// Mock logging utility
export const mockLog = (service: string, action: string, data?: any) => {
    if (MOCK_CONFIG.ENABLE_MOCK_LOGS) {
        console.log(`🔧 [MOCK ${service}] ${action}`, data ? data : '');
    }
};

// Simulate async operation with delay
export const mockDelay = (ms: number = MOCK_CONFIG.MOCK_DELAY_MS) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

// Mock Aave positions for different scenarios
export const createMockAavePositions = (userAddress: string): AavePosition[] => {
    mockLog('AAVE', 'Creating mock positions', { userAddress });

    return [
        {
            id: `${userAddress}-eth-collateral`,
            type: 'collateral',
            token: 'ETH',
            amount: '2000000000000000000', // 2 ETH
            formattedAmount: '2.0000',
            tokenAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        },
        {
            id: `${userAddress}-usdc-collateral`,
            type: 'collateral',
            token: 'USDC',
            amount: '5000000000', // 5000 USDC (6 decimals)
            formattedAmount: '5000.0000',
            tokenAddress: '0xA0b86a33E6441A3063BdFb663c6C8FAc6C8A4Ec2',
        },
        {
            id: `${userAddress}-dai-debt`,
            type: 'debt',
            token: 'DAI',
            amount: '3000000000000000000000', // 3000 DAI
            formattedAmount: '3000.0000',
            tokenAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        },
        {
            id: `${userAddress}-usdt-debt`,
            type: 'debt',
            token: 'USDT',
            amount: '1500000000', // 1500 USDT (6 decimals)
            formattedAmount: '1500.0000',
            tokenAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        }
    ];
};

// Mock PIV positions (vault positions)
export interface PivPosition {
    id: string;
    type: 'collateral' | 'debt';
    token: string;
    amount: string;
    formattedAmount: string;
    tokenAddress: string;
    orderId?: string; // Link to the order that created this position
}

export const createMockPivPositions = (): PivPosition[] => {
    mockLog('PIV', 'Creating mock PIV positions');

    return [
        {
            id: 'piv-wbtc-collateral-1',
            type: 'collateral',
            token: 'WBTC',
            amount: '50000000', // 0.5 WBTC (8 decimals)
            formattedAmount: '0.5000',
            tokenAddress: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
        },
        {
            id: 'piv-link-debt-1',
            type: 'debt',
            token: 'LINK',
            amount: '500000000000000000000', // 500 LINK
            formattedAmount: '500.0000',
            tokenAddress: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
        }
    ];
};

// Mock orders for order book
export const createMockOrders = (): Order[] => {
    mockLog('API', 'Creating mock orders');

    const baseOrders: Order[] = [
        {
            _id: 'mock-order-1',
            orderId: 'ORDER_001',
            owner: '0x1234567890123456789012345678901234567890',
            collateralToken: 'ETH',
            debtToken: 'USDC',
            collateralAmount: '1.5',
            price: '3000',
            status: 'OPEN',
            filledAmount: '0',
            interestRateMode: 'variable',
            isFromBlockchain: false,
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
            updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
        {
            _id: 'mock-order-2',
            orderId: 'ORDER_002',
            owner: '0x2345678901234567890123456789012345678901',
            collateralToken: 'WBTC',
            debtToken: 'DAI',
            collateralAmount: '0.1',
            price: '45000',
            status: 'OPEN',
            filledAmount: '0',
            interestRateMode: 'stable',
            isFromBlockchain: true,
            createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
            updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        },
        {
            _id: 'mock-order-3',
            orderId: 'ORDER_003',
            owner: '0x3456789012345678901234567890123456789012',
            collateralToken: 'USDC',
            debtToken: 'ETH',
            collateralAmount: '10000',
            price: '0.00033', // 1/3000
            status: 'FILLED',
            filledAmount: '10000',
            interestRateMode: 'variable',
            isFromBlockchain: false,
            createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 mins ago
            updatedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // filled 15 mins ago
        },
        {
            _id: 'mock-order-4',
            orderId: 'ORDER_004',
            owner: '0x4567890123456789012345678901234567890123',
            collateralToken: 'LINK',
            debtToken: 'USDT',
            collateralAmount: '1000',
            price: '15',
            status: 'OPEN',
            filledAmount: '250', // Partially filled
            interestRateMode: 'variable',
            isFromBlockchain: true,
            createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 mins ago
            updatedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // last update 10 mins ago
        }
    ];

    return baseOrders;
};

// Global mock data store for managing state across components
class MockDataStore {
    private aavePositions: Map<string, AavePosition[]> = new Map();
    private pivPositions: PivPosition[] = createMockPivPositions();
    private orders: Order[] = createMockOrders();
    private migratedPositions: Set<string> = new Set(); // Track migrated position IDs

    // Aave positions management
    getAavePositions(userAddress: string): AavePosition[] {
        if (!this.aavePositions.has(userAddress)) {
            this.aavePositions.set(userAddress, createMockAavePositions(userAddress));
        }
        return this.aavePositions.get(userAddress) || [];
    }

    removeAavePosition(userAddress: string, positionId: string): void {
        const positions = this.getAavePositions(userAddress);
        const filtered = positions.filter(p => p.id !== positionId);
        this.aavePositions.set(userAddress, filtered);
        this.migratedPositions.add(positionId);
        mockLog('STORE', `Removed Aave position ${positionId} for ${userAddress}`);
    }

    // PIV positions management
    getPivPositions(): PivPosition[] {
        return [...this.pivPositions];
    }

    addPivPosition(position: PivPosition): void {
        this.pivPositions.push(position);
        mockLog('STORE', 'Added PIV position', position);
    }

    // Orders management
    getOrders(): Order[] {
        return [...this.orders];
    }

    addOrder(order: Order): void {
        this.orders.unshift(order); // Add to beginning for recent-first display
        mockLog('STORE', 'Added new order', order);
    }

    updateOrderStatus(orderId: string, status: Order['status'], filledAmount?: string): void {
        const order = this.orders.find(o => o._id === orderId || o.orderId === orderId);
        if (order) {
            order.status = status;
            if (filledAmount !== undefined) {
                order.filledAmount = filledAmount;
            }
            order.updatedAt = new Date().toISOString();
            mockLog('STORE', `Updated order ${orderId} status to ${status}`);
        }
    }

    // Migration simulation
    simulateMigration(userAddress: string, aavePosition: AavePosition): { order: Order, pivPosition?: PivPosition } {
        mockLog('STORE', 'Simulating migration', { userAddress, aavePosition });

        // Create a new order from the Aave position
        const newOrder: Order = {
            _id: `migrated-${Date.now()}`,
            orderId: `MIGRATE_${Date.now()}`,
            owner: userAddress,
            collateralToken: aavePosition.type === 'collateral' ? aavePosition.token : 'ETH', // Default collateral
            debtToken: aavePosition.type === 'debt' ? aavePosition.token : 'USDC', // Default debt
            collateralAmount: aavePosition.type === 'collateral' ? aavePosition.formattedAmount : '0',
            price: this.calculateMockPrice(aavePosition.token),
            status: 'OPEN',
            filledAmount: '0',
            interestRateMode: 'variable',
            isFromBlockchain: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        // Add the order
        this.addOrder(newOrder);

        // Remove from Aave positions
        this.removeAavePosition(userAddress, aavePosition.id);

        // Optionally create a corresponding PIV position if it's a collateral migration
        let pivPosition: PivPosition | undefined;
        if (aavePosition.type === 'collateral') {
            pivPosition = {
                id: `piv-${aavePosition.token.toLowerCase()}-${Date.now()}`,
                type: 'collateral',
                token: aavePosition.token,
                amount: aavePosition.amount,
                formattedAmount: aavePosition.formattedAmount,
                tokenAddress: aavePosition.tokenAddress,
                orderId: newOrder._id,
            };
            this.addPivPosition(pivPosition);
        }

        return { order: newOrder, pivPosition };
    }

    private calculateMockPrice(token: string): string {
        // Mock price calculation for different tokens
        const mockPrices: Record<string, string> = {
            'ETH': '3000',
            'WBTC': '45000',
            'USDC': '1',
            'USDT': '1',
            'DAI': '1',
            'LINK': '15',
            'AAVE': '100',
        };
        return mockPrices[token] || '1';
    }

    // Reset all data (useful for testing)
    reset(): void {
        this.aavePositions.clear();
        this.pivPositions = createMockPivPositions();
        this.orders = createMockOrders();
        this.migratedPositions.clear();
        mockLog('STORE', 'Reset all mock data');
    }
}

// Global instance
export const mockDataStore = new MockDataStore();

// Export mock data for backward compatibility
export const mockAavePositions = createMockAavePositions('0x1234567890123456789012345678901234567890');
export const mockOrders = createMockOrders();
export const mockPivPositions = createMockPivPositions();
