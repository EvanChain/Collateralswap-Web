// Test Aave connection and data retrieval
import { getAaveUtils } from './aaveUtils';

export async function testAaveConnection(userAddress: string) {
    console.log('=== Testing Aave Connection ===');

    try {
        const aaveUtils = await getAaveUtils();

        if (!aaveUtils) {
            console.error('❌ Failed to initialize Aave utils');
            return false;
        }

        console.log('✅ Aave utils initialized successfully');

        // Test getting user positions with both methods
        console.log('--- Testing main method ---');
        try {
            const positions = await aaveUtils.getUserAavePositions(userAddress);
            console.log('✅ Main method - Aave positions fetched:', positions);
        } catch (mainError) {
            console.error('❌ Main method failed:', mainError);

            // Test the simplified method
            console.log('--- Testing simplified method ---');
            try {
                const simplePositions = await (aaveUtils as any).getUserAavePositionsSimple(userAddress);
                console.log('✅ Simplified method - Aave positions fetched:', simplePositions);
            } catch (simpleError) {
                console.error('❌ Simplified method also failed:', simpleError);
            }
        }

        // Test getting user account data
        console.log('--- Testing user account data ---');
        try {
            const accountData = await aaveUtils.getUserAccountData(userAddress);
            console.log('✅ User account data:', accountData);
        } catch (accountError) {
            console.error('❌ User account data failed:', accountError);
        }

        return true;
    } catch (error) {
        console.error('❌ Aave connection test failed:', error);
        return false;
    }
}

// Helper to run test from browser console
if (typeof window !== 'undefined') {
    (window as any).testAaveConnection = testAaveConnection;
}
