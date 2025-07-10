// Migration service for moving positions from Aave to PIV
import { AavePosition } from './aaveUtils';
import { Order } from './api';
import { PivPosition, MOCK_CONFIG, mockLog, mockDelay, mockDataStore } from './mockData';
import { getPivUtils } from './mockPivUtils';
import { orderApi } from './api';

export interface MigrationRequest {
    userAddress: string;
    aavePosition: AavePosition;
    migrationType: 'aaveToVault' | 'placeOrder';
    collateralToken: string;
    collateralAmount: string;
    debtToken: string;
    debtAmount?: string; // For migration to vault
    price?: string; // For order creation
    interestRateMode?: 'stable' | 'variable';
}

export interface MigrationResult {
    success: boolean;
    order?: Order;
    pivPosition?: PivPosition;
    error?: string;
    transactionHash?: string;
}

export class MigrationService {

    /**
     * Migrate an Aave position to PIV vault or create an order
     */
    async migratePosition(request: MigrationRequest): Promise<MigrationResult> {
        try {
            mockLog('MIGRATION', 'Starting position migration', request);

            if (MOCK_CONFIG.GLOBAL_MOCK_MODE || MOCK_CONFIG.USE_MOCK_CONTRACTS) {
                return await this.mockMigratePosition(request);
            }

            // Real implementation would go here
            return await this.realMigratePosition(request);

        } catch (error) {
            console.error('Migration failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown migration error'
            };
        }
    }

    /**
     * Mock migration implementation for development
     */
    private async mockMigratePosition(request: MigrationRequest): Promise<MigrationResult> {
        mockLog('MIGRATION', 'Using mock migration', request);
        await mockDelay(1200); // Longer delay for migration simulation

        const { userAddress, aavePosition, migrationType } = request;

        try {
            if (migrationType === 'aaveToVault') {
                // Direct migration to PIV vault
                return await this.mockMigrateToVault(userAddress, aavePosition, request);
            } else {
                // Create order for the position
                return await this.mockCreateMigrationOrder(userAddress, aavePosition, request);
            }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Mock migration failed'
            };
        }
    }

    /**
     * Mock migration to PIV vault
     */
    private async mockMigrateToVault(
        userAddress: string,
        aavePosition: AavePosition,
        request: MigrationRequest
    ): Promise<MigrationResult> {
        mockLog('MIGRATION', 'Mock migration to vault', { userAddress, aavePosition, request });

        // Use the new mock migration method with enhanced structure
        const mockRequest = {
            userAddress: request.userAddress,
            aavePosition: request.aavePosition,
            migrationType: request.migrationType,
            collateralToken: request.collateralToken,
            collateralAmount: request.collateralAmount,
            debtToken: request.debtToken,
            debtAmount: request.debtAmount,
            price: request.price,
            interestRateMode: request.interestRateMode || 'variable'
        };

        const result = mockDataStore.simulateNewMigration(mockRequest);

        if (result.success) {
            return {
                success: true,
                pivPosition: result.pivPosition,
                order: result.order ? {
                    _id: result.order._id,
                    orderId: result.order.orderId,
                    owner: userAddress,
                    collateralToken: request.collateralToken,
                    debtToken: request.debtToken,
                    collateralAmount: request.collateralAmount,
                    price: request.price || '1',
                    status: 'OPEN' as const,
                    filledAmount: '0',
                    interestRateMode: request.interestRateMode,
                    isFromBlockchain: false,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                } : undefined,
                transactionHash: `0x${Math.random().toString(16).substr(2, 64)}` // Mock tx hash
            };
        }

        return {
            success: false,
            error: result.error || 'Migration failed'
        };
    }

    /**
     * Mock creation of migration order
     */
    private async mockCreateMigrationOrder(
        userAddress: string,
        aavePosition: AavePosition,
        request: MigrationRequest
    ): Promise<MigrationResult> {
        mockLog('MIGRATION', 'Mock creation of migration order', { userAddress, aavePosition, request });

        // Use the provided parameters from the request
        const collateralToken = request.collateralToken;
        const debtToken = request.debtToken;
        const collateralAmount = request.collateralAmount;

        // Create the order through API
        try {
            const orderData = {
                owner: userAddress,
                collateralToken: collateralToken,
                debtToken: debtToken,
                collateralAmount: collateralAmount,
                price: request.price || this.calculateMigrationPrice(collateralToken, debtToken),
                interestRateMode: request.interestRateMode || 'variable'
            };

            const newOrder = await orderApi.createOrder(orderData);

            // Remove from Aave positions
            mockDataStore.removeAavePosition(userAddress, aavePosition.id);

            return {
                success: true,
                order: newOrder,
                transactionHash: `0x${Math.random().toString(16).substr(2, 64)}` // Mock tx hash
            };

        } catch (error) {
            throw new Error(`Failed to create migration order: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Real migration implementation (placeholder)
     */
    private async realMigratePosition(request: MigrationRequest): Promise<MigrationResult> {
        // This would contain the actual blockchain interaction logic
        throw new Error('Real migration not implemented yet');
    }

    /**
     * Calculate migration price for order
     */
    private calculateMigrationPrice(collateralToken: string, debtToken: string): string {
        // Mock price calculation
        const mockPrices: Record<string, number> = {
            'ETH': 3000,
            'WBTC': 45000,
            'USDC': 1,
            'USDT': 1,
            'DAI': 1,
            'LINK': 15,
            'AAVE': 100,
        };

        const collateralPrice = mockPrices[collateralToken] || 1;
        const debtPrice = mockPrices[debtToken] || 1;

        // Calculate price ratio with a small discount for migration incentive
        const ratio = (debtPrice / collateralPrice) * 0.98; // 2% discount
        return ratio.toFixed(6);
    }

    /**
     * Get migration history for a user
     */
    async getMigrationHistory(userAddress: string): Promise<Order[]> {
        if (MOCK_CONFIG.GLOBAL_MOCK_MODE || MOCK_CONFIG.USE_MOCK_API) {
            await mockDelay();
            const allOrders = mockDataStore.getOrders();
            return allOrders.filter(order =>
                order.owner.toLowerCase() === userAddress.toLowerCase() &&
                order.orderId?.includes('MIGRATE')
            );
        }

        // Real implementation would query blockchain or backend
        return [];
    }

    /**
     * Check if a position can be migrated
     */
    canMigrate(position: AavePosition): { canMigrate: boolean; reason?: string } {
        // Basic validation
        if (!position.amount || position.amount === '0') {
            return {
                canMigrate: false,
                reason: 'Position amount is zero'
            };
        }

        const amount = parseFloat(position.formattedAmount);
        if (amount < 0.0001) {
            return {
                canMigrate: false,
                reason: 'Position amount too small'
            };
        }

        return {
            canMigrate: true
        };
    }

    /**
     * Estimate migration gas costs (mock)
     */
    async estimateMigrationCost(request: MigrationRequest): Promise<{
        estimatedGas: string;
        estimatedCostUSD: string;
    }> {
        await mockDelay(500);

        return {
            estimatedGas: '350000', // Mock gas estimate
            estimatedCostUSD: '25.50' // Mock USD cost
        };
    }
}

// Singleton instance
export const migrationService = new MigrationService();

export default MigrationService;
