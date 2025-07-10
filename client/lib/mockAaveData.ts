// Mock Aave positions for testing purposes
export const mockAavePositions = [
    {
        id: 'mock-usdc-collateral',
        type: 'collateral' as const,
        token: 'USDC',
        amount: '1000.0',
        formattedAmount: '1000.0000',
        tokenAddress: '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8',
    },
    {
        id: 'mock-eth-debt',
        type: 'debt' as const,
        token: 'ETH',
        amount: '0.5',
        formattedAmount: '0.5000',
        tokenAddress: '0x0000000000000000000000000000000000000000',
    },
    {
        id: 'mock-link-collateral',
        type: 'collateral' as const,
        token: 'LINK',
        amount: '50.0',
        formattedAmount: '50.0000',
        tokenAddress: '0xf8Fb3713D459D7C1018BD0A49D19b4C44290EBE5',
    }
];

export const useMockAavePositions = process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_MOCK_AAVE === 'true';
