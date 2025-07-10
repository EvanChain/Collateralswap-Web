import { ethers } from 'ethers';
import { getAaveUtils } from './aaveUtils';

/**
 * Test script to verify Aave contract integration
 * This can be used to test the new contract-based aaveUtils
 */
export async function testAaveContractIntegration() {
    try {
        console.log('=== Testing Aave Contract Integration ===');

        // Test with a sample address (you can replace with a real address that has Aave positions)
        const testAddress = '0x1234567890123456789012345678901234567890'; // Replace with real address for testing

        console.log(`Testing with address: ${testAddress}`);

        // Get AaveUtils instance (will use default RPC provider)
        const aaveUtils = await getAaveUtils();

        if (!aaveUtils) {
            throw new Error('Failed to create AaveUtils instance');
        }

        console.log('AaveUtils instance created successfully');

        // Fetch user positions
        console.log('Fetching user Aave positions...');
        const positions = await aaveUtils.getUserAavePositions(testAddress);

        console.log('=== Results ===');
        console.log(`Found ${positions.length} positions:`);

        positions.forEach((position, index) => {
            console.log(`Position ${index + 1}:`);
            console.log(`  Type: ${position.type}`);
            console.log(`  Token: ${position.token}`);
            console.log(`  Amount: ${position.formattedAmount}`);
            console.log(`  Token Address: ${position.tokenAddress}`);
            console.log('---');
        });

        return positions;
    } catch (error) {
        console.error('Error testing Aave contract integration:', error);
        throw error;
    }
}

/**
 * Test with a custom provider (for browser environments)
 */
export async function testAaveWithCustomProvider(provider: ethers.providers.Provider, userAddress: string) {
    try {
        console.log('=== Testing Aave with Custom Provider ===');
        console.log(`Testing with address: ${userAddress}`);

        // Get AaveUtils instance with custom provider
        const aaveUtils = await getAaveUtils(provider);

        if (!aaveUtils) {
            throw new Error('Failed to create AaveUtils instance with custom provider');
        }

        console.log('AaveUtils instance created successfully with custom provider');

        // Fetch user positions
        const positions = await aaveUtils.getUserAavePositions(userAddress);

        console.log('=== Results ===');
        console.log(`Found ${positions.length} positions for address ${userAddress}:`);

        positions.forEach((position, index) => {
            console.log(`Position ${index + 1}:`);
            console.log(`  Type: ${position.type}`);
            console.log(`  Token: ${position.token}`);
            console.log(`  Amount: ${position.formattedAmount}`);
            console.log(`  Token Address: ${position.tokenAddress}`);
        });

        return positions;
    } catch (error) {
        console.error('Error testing Aave with custom provider:', error);
        throw error;
    }
}
