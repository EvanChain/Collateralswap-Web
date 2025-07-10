import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/router', () => ({
    useRouter() {
        return {
            route: '/',
            pathname: '/',
            query: {},
            asPath: '/',
            push: jest.fn(),
            pop: jest.fn(),
            reload: jest.fn(),
            back: jest.fn(),
            prefetch: jest.fn().mockResolvedValue(undefined),
            beforePopState: jest.fn(),
            events: {
                on: jest.fn(),
                off: jest.fn(),
                emit: jest.fn(),
            },
        }
    },
}))

// Mock environment variables
process.env.NEXT_PUBLIC_MOCK_MODE = 'true'
process.env.NEXT_PUBLIC_API_BASE_URL = 'http://localhost:3001'
process.env.NEXT_PUBLIC_ROUTER_CONTRACT_ADDRESS = '0x1234567890123456789012345678901234567890'
process.env.NEXT_PUBLIC_PIV_CONTRACT_ADDRESS = '0x2345678901234567890123456789012345678901'

// Setup global fetch mock
global.fetch = jest.fn()

// Mock window.ethereum for Web3 tests
Object.defineProperty(window, 'ethereum', {
    writable: true,
    value: {
        request: jest.fn(),
        on: jest.fn(),
        removeListener: jest.fn(),
    },
})

// Console mock to reduce noise in tests
global.console = {
    ...console,
    // Uncomment to ignore specific log levels
    // log: jest.fn(),
    // debug: jest.fn(),
    // info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
}
