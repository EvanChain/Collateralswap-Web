// Mock Web3 和合约调用
const mockContractMethods = {
    swap: jest.fn().mockReturnValue({
        call: jest.fn().mockResolvedValue(['1000000000000000000', '900000000000000000']) // [netAmountOut, totalInputAmount]
    }),
    deployPIV: jest.fn().mockReturnValue({
        call: jest.fn().mockResolvedValue('0x1234567890123456789012345678901234567890'),
        send: jest.fn().mockResolvedValue({
            transactionHash: '0xabcdef1234567890',
            events: {
                PIVDeployed: {
                    returnValues: {
                        pivAddress: '0x1234567890123456789012345678901234567890'
                    }
                }
            }
        })
    }),
    ADDRESSES_PROVIDER: jest.fn().mockReturnValue({
        call: jest.fn().mockResolvedValue('0xAAddressProvider1234567890123456789012')
    }),
    POOL: jest.fn().mockReturnValue({
        call: jest.fn().mockResolvedValue('0xPoolAddress1234567890123456789012345678')
    })
};

const mockContract = {
    methods: mockContractMethods
};

const mockWeb3 = {
    eth: {
        Contract: jest.fn().mockImplementation(() => mockContract)
    }
};

// Mock Web3 constructor
const Web3 = jest.fn().mockImplementation(() => mockWeb3);

module.exports = Web3;
module.exports.mockWeb3 = mockWeb3;
module.exports.mockContract = mockContract;
module.exports.mockContractMethods = mockContractMethods;
