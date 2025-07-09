// Mock Web3 和合约调用
const mockContractMethods = {
    swap: jest.fn().mockReturnValue({
        call: jest.fn().mockResolvedValue(['1000000000000000000', '900000000000000000']) // [amountOut, totalInputAmount]
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
