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
    targetToken?: string;
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
                return await this.mockMigrateToVault(userAddress, aavePosition);
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
    private async mockMigrateToVault(userAddress: string, aavePosition: AavePosition): Promise<MigrationResult> {
        mockLog('MIGRATION', 'Mock migration to vault', { userAddress, aavePosition });

        // Simulate the migration process
        const result = mockDataStore.simulateMigration(userAddress, aavePosition);

        // If it's a collateral position, also create a PIV position
        if (aavePosition.type === 'collateral') {
            const pivPosition: PivPosition = {
                id: `piv-migrated-${Date.now()}`,
                type: 'collateral',
                token: aavePosition.token,
                amount: aavePosition.amount,
                formattedAmount: aavePosition.formattedAmount,
                tokenAddress: aavePosition.tokenAddress,
                orderId: result.order._id,
            };

            mockDataStore.addPivPosition(pivPosition);

            return {
                success: true,
                order: result.order,
                pivPosition: pivPosition,
                transactionHash: `0x${Math.random().toString(16).substr(2, 64)}` // Mock tx hash
            };
        }

        return {
            success: true,
            order: result.order,
            transactionHash: `0x${Math.random().toString(16).substr(2, 64)}` // Mock tx hash
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

        // Determine order parameters based on position type
        let collateralToken: string;
        let debtToken: string;
        let collateralAmount: string;

        if (aavePosition.type === 'collateral') {
            collateralToken = aavePosition.token;
            debtToken = request.targetToken || 'USDC'; // Default debt token
            collateralAmount = aavePosition.formattedAmount;
        } else {
            // For debt positions, we might want to create an order to swap for collateral
            collateralToken = request.targetToken || 'ETH'; // Default collateral token
            debtToken = aavePosition.token;
            collateralAmount = '0'; // To be filled by counterparty
        }

        // Create the order through API
        try {
            const orderData = {
                owner: userAddress,
                collateralToken: collateralToken,
                debtToken: debtToken,
                collateralAmount: collateralAmount,
                price: this.calculateMigrationPrice(collateralToken, debtToken),
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
