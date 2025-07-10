import { ethers } from 'ethers';
import { UiPoolDataProvider, UiIncentiveDataProvider, ChainId } from '@aave/contract-helpers';
import { formatReserves, formatUserSummary } from '@aave/math-utils';
import { AaveV3Sepolia } from '@bgd-labs/aave-address-book';
import { TOKEN_CONFIG, CONTRACT_CONFIG } from '../config/appConfig';
import { MOCK_CONFIG, mockLog, mockDelay, mockDataStore } from './mockData';

export interface AavePosition {
    id: string;
    type: 'collateral' | 'debt';
    token: string;
    amount: string;
    formattedAmount: string;
    tokenAddress: string;
}

export class AaveUtils {
    private provider: ethers.providers.Provider;
    private uiPoolDataProvider: UiPoolDataProvider;
    private uiIncentiveDataProvider: UiIncentiveDataProvider;
    private poolAddressProvider: string;
    private chainId: ChainId;

    constructor(provider: ethers.providers.Provider) {
        this.provider = provider;
        this.chainId = ChainId.sepolia; // Using Sepolia testnet

        // Use Aave V3 Sepolia addresses from address book
        this.poolAddressProvider = AaveV3Sepolia.POOL_ADDRESSES_PROVIDER;

        // Initialize Aave contract helpers
        this.uiPoolDataProvider = new UiPoolDataProvider({
            uiPoolDataProviderAddress: AaveV3Sepolia.UI_POOL_DATA_PROVIDER,
            provider: this.provider,
            chainId: this.chainId,
        });

        this.uiIncentiveDataProvider = new UiIncentiveDataProvider({
            uiIncentiveDataProviderAddress: AaveV3Sepolia.UI_INCENTIVE_DATA_PROVIDER,
            provider: this.provider,
            chainId: this.chainId,
        });
    }

    async getUserAavePositions(userAddress: string): Promise<AavePosition[]> {
        // Check if we should use mock data
        if (MOCK_CONFIG.GLOBAL_MOCK_MODE || MOCK_CONFIG.USE_MOCK_AAVE) {
            mockLog('AAVE', 'Using mock data for getUserAavePositions', { userAddress });
            await mockDelay();
            return mockDataStore.getAavePositions(userAddress);
        }

        try {
            console.log('Starting to fetch Aave positions for:', userAddress);

            // Validate user address
            if (!ethers.utils.isAddress(userAddress)) {
                throw new Error('Invalid user address');
            }

            // Fetch reserves data and user reserves data from Aave contracts
            const [reservesData, userReservesData] = await Promise.all([
                this.uiPoolDataProvider.getReservesHumanized({
                    lendingPoolAddressProvider: this.poolAddressProvider,
                }),
                this.uiPoolDataProvider.getUserReservesHumanized({
                    lendingPoolAddressProvider: this.poolAddressProvider,
                    user: userAddress,
                }),
            ]);

            console.log('Raw reserves data:', reservesData);
            console.log('Raw user reserves data:', userReservesData);

            // Format the data using Aave math utilities with proper BigNumber handling
            const formattedReserves = formatReserves({
                reserves: reservesData.reservesData,
                currentTimestamp: Date.now(),
                marketReferenceCurrencyDecimals: 18,
                marketReferencePriceInUsd: '1',
            });

            const userSummary = formatUserSummary({
                currentTimestamp: Date.now(),
                marketReferencePriceInUsd: '1',
                marketReferenceCurrencyDecimals: 18,
                userReserves: userReservesData.userReserves,
                formattedReserves,
                userEmodeCategoryId: userReservesData.userEmodeCategoryId,
            });

            console.log('Formatted user summary:', userSummary);

            const positions: AavePosition[] = [];

            // Process user reserves to extract positions
            userReservesData.userReserves.forEach((userReserve, index) => {
                const reserve = formattedReserves.find(r =>
                    r.underlyingAsset.toLowerCase() === userReserve.underlyingAsset.toLowerCase()
                );

                if (!reserve) {
                    console.warn(`Reserve not found for asset: ${userReserve.underlyingAsset}`);
                    return;
                }

                console.log(`Processing user reserve ${index}:`, { userReserve, reserve });

                const tokenSymbol = reserve.symbol;
                const tokenAddress = userReserve.underlyingAsset;
                const decimals = reserve.decimals;

                // Process collateral (aToken balance) - use scaledATokenBalance with proper BigNumber handling
                try {
                    const scaledATokenBalance = ethers.BigNumber.from(userReserve.scaledATokenBalance || '0');
                    if (!scaledATokenBalance.isZero()) {
                        // Calculate actual balance using reserve's liquidity index from formatted data
                        const liquidityIndex = ethers.utils.parseUnits(reserve.liquidityIndex, 27);

                        // Prevent overflow by checking if numbers are too large
                        if (scaledATokenBalance.gt(ethers.constants.MaxUint256.div(liquidityIndex))) {
                            console.warn(`Potential overflow detected for ${tokenSymbol} collateral calculation`);
                            return;
                        }

                        const actualBalance = scaledATokenBalance.mul(liquidityIndex).div(ethers.BigNumber.from(10).pow(27));
                        const collateralAmount = parseFloat(ethers.utils.formatUnits(actualBalance, decimals));

                        if (collateralAmount > 0.0001) { // Only show meaningful amounts
                            const collateralPosition: AavePosition = {
                                id: `${tokenAddress}-collateral`,
                                type: 'collateral',
                                token: tokenSymbol,
                                amount: actualBalance.toString(),
                                formattedAmount: collateralAmount.toFixed(6),
                                tokenAddress: tokenAddress,
                            };
                            console.log('Adding collateral position:', collateralPosition);
                            positions.push(collateralPosition);
                        }
                    }
                } catch (error) {
                    console.error(`Error processing collateral for ${tokenSymbol}:`, error);
                }

                // Process debt (variable debt) - use scaledVariableDebt with proper BigNumber handling
                try {
                    const scaledVariableDebt = ethers.BigNumber.from(userReserve.scaledVariableDebt || '0');
                    if (!scaledVariableDebt.isZero()) {
                        // Calculate actual debt using reserve's variable borrow index from formatted data
                        const variableBorrowIndex = ethers.utils.parseUnits(reserve.variableBorrowIndex, 27);

                        // Prevent overflow by checking if numbers are too large
                        if (scaledVariableDebt.gt(ethers.constants.MaxUint256.div(variableBorrowIndex))) {
                            console.warn(`Potential overflow detected for ${tokenSymbol} debt calculation`);
                            return;
                        }

                        const actualDebt = scaledVariableDebt.mul(variableBorrowIndex).div(ethers.BigNumber.from(10).pow(27));
                        const debtAmount = parseFloat(ethers.utils.formatUnits(actualDebt, decimals));

                        if (debtAmount > 0.0001) { // Only show meaningful amounts
                            const debtPosition: AavePosition = {
                                id: `${tokenAddress}-debt`,
                                type: 'debt',
                                token: tokenSymbol,
                                amount: actualDebt.toString(),
                                formattedAmount: debtAmount.toFixed(6),
                                tokenAddress: tokenAddress,
                            };
                            console.log('Adding debt position:', debtPosition);
                            positions.push(debtPosition);
                        }
                    }
                } catch (error) {
                    console.error(`Error processing debt for ${tokenSymbol}:`, error);
                }
            });

            console.log('Final positions from contracts:', positions);
            return positions;
        } catch (error) {
            console.error('Error fetching Aave positions from contracts:', error);
            console.error('Error details:', {
                message: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined
            });

            // For errors, return sample data in development
            if (process.env.NODE_ENV === 'development') {
                console.log('Contract calls failed, using mock data for development');
                return mockDataStore.getAavePositions(userAddress);
            }
            return [];
        }
    }

    // Simplified method kept for backward compatibility
    async getUserAavePositionsSimple(userAddress: string): Promise<AavePosition[]> {
        // Just call the main method since we're using contracts now
        return await this.getUserAavePositions(userAddress);
    }
}

// Helper function to create AaveUtils instance
export const getAaveUtils = async (provider?: ethers.providers.Provider): Promise<AaveUtils | null> => {
    try {
        // If in mock mode, return a mock-aware instance
        if (MOCK_CONFIG.GLOBAL_MOCK_MODE || MOCK_CONFIG.USE_MOCK_AAVE) {
            mockLog('AAVE', 'Creating mock-aware AaveUtils instance');
            // Create a minimal provider for mock mode
            const mockProvider = provider || new ethers.providers.JsonRpcProvider('http://localhost:8545');
            return new AaveUtils(mockProvider);
        }

        console.log('Initializing Aave utils with contract helpers...');

        // Create or get provider
        let ethersProvider: ethers.providers.Provider;

        if (provider) {
            ethersProvider = provider;
        } else {
            // Create a default provider using RPC URL from config
            const rpcUrl = CONTRACT_CONFIG.RPC_URL || CONTRACT_CONFIG.SEPOLIA_RPC_URL;
            ethersProvider = new ethers.providers.JsonRpcProvider(rpcUrl);
        }

        console.log('Creating AaveUtils instance with provider...');
        const aaveUtils = new AaveUtils(ethersProvider);
        console.log('AaveUtils created successfully for contract usage');

        return aaveUtils;
    } catch (error) {
        console.error('Error creating Aave utils:', error);
        console.error('Error details:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        });
        return null;
    }
};

// Sample data generator (for development/testing)
export function createSampleAavePositions(userAddress: string): AavePosition[] {
    console.log('Creating sample Aave positions for development');
    return [
        {
            id: `${userAddress}-collateral`,
            type: 'collateral',
            token: 'ETH',
            amount: '1000000000000000000', // 1 ETH in wei
            formattedAmount: '1',
            tokenAddress: '0x0000000000000000000000000000000000000000', // Sample token address
        },
        {
            id: `${userAddress}-debt`,
            type: 'debt',
            token: 'DAI',
            amount: '500000000000000000', // 0.5 DAI in wei
            formattedAmount: '0.5',
            tokenAddress: '0x0000000000000000000000000000000000000001', // Sample token address
        },
    ];
}

