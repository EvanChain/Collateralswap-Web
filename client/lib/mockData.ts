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
export const createMockOrders = (userAddress?: string): Order[] => {
    mockLog('API', 'Creating mock orders', { userAddress });

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

    // Add user's own orders if userAddress is provided
    if (userAddress) {
        const userOrders: Order[] = [
            {
                _id: 'user-order-1',
                orderId: 'USER_ORDER_001',
                owner: userAddress,
                collateralToken: 'ETH',
                debtToken: 'USDC',
                collateralAmount: '2.0',
                price: '3100',
                status: 'OPEN',
                filledAmount: '0',
                interestRateMode: 'variable',
                isFromBlockchain: false,
                createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
                updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
            },
            {
                _id: 'user-order-2',
                orderId: 'USER_ORDER_002',
                owner: userAddress,
                collateralToken: 'WBTC',
                debtToken: 'USDC',
                collateralAmount: '0.05',
                price: '44000',
                status: 'OPEN',
                filledAmount: '0',
                interestRateMode: 'stable',
                isFromBlockchain: false,
                createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 mins ago
                updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            }
        ];

        // Add user orders at the beginning
        baseOrders.unshift(...userOrders);
    }

    return baseOrders;
};

// Mock migration request interface to match the new structure
export interface MockMigrationRequest {
    userAddress: string;
    aavePosition: any;
    migrationType: "aaveToVault" | "placeOrder";
    collateralToken: string;
    collateralAmount: string;
    debtToken: string;
    debtAmount?: string; // For migration
    price?: string; // For order creation
    interestRateMode: "stable" | "variable";
}

// Mock migration result
export interface MockMigrationResult {
    success: boolean;
    error?: string;
    order?: {
        orderId: string;
        _id: string;
    };
    pivPosition?: PivPosition;
}

// Global mock data store for managing state across components
class MockDataStore {
    private aavePositions: Map<string, AavePosition[]> = new Map();
    private pivPositions: PivPosition[] = createMockPivPositions();
    private orders: Order[] = [];
    private migratedPositions: Set<string> = new Set(); // Track migrated position IDs
    private currentUserAddress: string | null = null;

    // Initialize orders based on user address
    private initializeOrders(userAddress?: string): void {
        if (!userAddress || this.currentUserAddress === userAddress) return;

        this.currentUserAddress = userAddress;
        this.orders = createMockOrders(userAddress);
        mockLog('STORE', `Initialized orders for user ${userAddress}`, this.orders);
    }

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
    getOrders(userAddress?: string): Order[] {
        this.initializeOrders(userAddress);
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

    // Enhanced migration simulation with new structure
    simulateNewMigration(request: MockMigrationRequest): MockMigrationResult {
        mockLog('STORE', 'Simulating new migration', request);

        try {
            if (request.migrationType === "aaveToVault") {
                // Migration to vault - create PIV position
                const pivPosition: PivPosition = {
                    id: `piv-migrated-${Date.now()}`,
                    type: 'collateral',
                    token: request.collateralToken,
                    amount: this.parseAmount(request.collateralAmount, request.collateralToken),
                    formattedAmount: request.collateralAmount,
                    tokenAddress: this.getTokenAddress(request.collateralToken),
                };

                this.addPivPosition(pivPosition);

                // Remove from Aave positions
                this.removeAavePosition(request.userAddress, request.aavePosition.id);

                return {
                    success: true,
                    pivPosition
                };

            } else if (request.migrationType === "placeOrder") {
                // Create order
                const newOrder: Order = {
                    _id: `order-${Date.now()}`,
                    orderId: `ORDER_${Date.now()}`,
                    owner: request.userAddress,
                    collateralToken: request.collateralToken,
                    debtToken: request.debtToken,
                    collateralAmount: request.collateralAmount,
                    price: request.price || this.calculateMockPrice(request.collateralToken),
                    status: 'OPEN',
                    filledAmount: '0',
                    interestRateMode: request.interestRateMode,
                    isFromBlockchain: false,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };

                this.addOrder(newOrder);

                return {
                    success: true,
                    order: {
                        orderId: newOrder.orderId!,
                        _id: newOrder._id
                    }
                };
            }

            return {
                success: false,
                error: 'Invalid migration type'
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    // Helper method to parse amount based on token decimals
    private parseAmount(formattedAmount: string, token: string): string {
        const decimals = this.getTokenDecimals(token);
        const amount = parseFloat(formattedAmount);
        return (amount * Math.pow(10, decimals)).toString();
    }

    // Helper method to get token decimals
    private getTokenDecimals(token: string): number {
        const decimalsMap: Record<string, number> = {
            'ETH': 18,
            'WBTC': 8,
            'USDC': 6,
            'USDT': 6,
            'DAI': 18,
            'LINK': 18,
            'AAVE': 18,
        };
        return decimalsMap[token] || 18;
    }

    // Helper method to get token address
    private getTokenAddress(token: string): string {
        const addressMap: Record<string, string> = {
            'ETH': '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
            'WBTC': '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
            'USDC': '0xA0b86a33E6441A3063BdFb663c6C8FAc6C8A4Ec2',
            'USDT': '0xdAC17F958D2ee523a2206206994597C13D831ec7',
            'DAI': '0x6B175474E89094C44Da98b954EedeAC495271d0F',
            'LINK': '0x514910771AF9Ca656af840dff83E8264EcF986CA',
            'AAVE': '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
        };
        return addressMap[token] || '0x0000000000000000000000000000000000000000';
    }

    // Order management methods
    updateOrderPrice(orderId: string, newPrice: string): boolean {
        const order = this.orders.find(o => o._id === orderId);
        if (order) {
            order.price = newPrice;
            order.updatedAt = new Date().toISOString();
            mockLog('STORE', `Updated order ${orderId} price to ${newPrice}`);
            return true;
        }
        return false;
    }

    cancelOrder(orderId: string): boolean {
        const orderIndex = this.orders.findIndex(o => o._id === orderId);
        if (orderIndex !== -1) {
            this.orders.splice(orderIndex, 1);
            mockLog('STORE', `Cancelled order ${orderId}`);
            return true;
        }
        return false;
    }

    // Helper method for mock price calculation
    private calculateMockPrice(token: string): string {
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
        this.orders = [];
        this.migratedPositions.clear();
        this.currentUserAddress = null;
        mockLog('STORE', 'Reset all mock data');
    }
}

// Global instance
export const mockDataStore = new MockDataStore();

// Export mock data for backward compatibility
export const mockAavePositions = createMockAavePositions('0x1234567890123456789012345678901234567890');
export const mockOrders = createMockOrders();
export const mockPivPositions = createMockPivPositions();
