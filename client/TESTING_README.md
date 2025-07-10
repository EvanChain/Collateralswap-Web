# CollateralSwap Frontend Testing Guide

This document explains how to test the CollateralSwap frontend with mock backend and contract interactions.

## Overview

The frontend has been configured with a comprehensive mock system that simulates:

- Backend API calls for order management
- Smart contract interactions (PIV and Router contracts)
- Wallet connection and transactions
- Token swaps, position migration, and order placement

## Mock Mode Setup

### 1. Environment Configuration

Copy `.env.example` to `.env.local` and ensure mock mode is enabled:

```bash
NEXT_PUBLIC_MOCK_MODE=true
```

### 2. Running the Application

Start the development server:

```bash
npm run dev
# or
pnpm dev
```

The application will run in mock mode, simulating all backend and contract interactions.

## Testing Methods

### 1. Interactive Dashboard

Visit `http://localhost:3000/test` to access the comprehensive test dashboard that provides:

- **Test Scenarios**: Pre-configured test scenarios for different use cases
- **Interactive Tests**: Manual testing of individual functions
- **Test Results**: Real-time results and performance metrics
- **Mock Data Management**: Reset and configure mock data

### 2. Automated Tests

Run the test suite with Jest:

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:swap        # Swap functionality tests
npm run test:migration   # Position migration tests
npm run test:order       # Place order tests
npm run test:integration # Full integration tests

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### 3. Manual Testing in App

Navigate through the regular app interface:

- **Swap Page** (`/`): Test token swapping with mock order book
- **Position Page** (`/position`): Test Aave migration functionality
- **Test Page** (`/test`): Interactive test dashboard

## Test Scenarios

### Swap Functionality

1. **Successful Swap**
   - Creates mock orders with sufficient liquidity
   - Tests order matching and execution
   - Verifies slippage protection

2. **Insufficient Liquidity**
   - Tests behavior with limited order book
   - Verifies error handling

### Position Migration

1. **Aave Migration**
   - Tests migration from Aave to PIV
   - Verifies debt optimization (5% reduction)
   - Tests different interest rate modes

### Order Management

1. **Place Orders**
   - Tests order creation via both API and contract
   - Verifies order tracking and status updates
   - Tests order cancellation

2. **Multiple Orders**
   - Tests concurrent order placement
   - Verifies data consistency

## Mock Data Structure

### Orders

```typescript
interface Order {
  _id: string
  orderId?: string
  owner: string
  collateralToken: string
  debtToken: string
  collateralAmount: string
  price: string
  status: 'OPEN' | 'FILLED' | 'CANCELLED'
  filledAmount: string
  interestRateMode?: string
  isFromBlockchain: boolean
  createdAt: string
  updatedAt: string
}
```

### Default Mock Orders

- USDC → WETH order (1000 USDC for 2 WETH)
- WETH → USDC order (1 WETH for 2000 USDC)

## API Endpoints (Mocked)

All API calls are intercepted and handled by the mock service:

- `GET /api/orders/list` - Get all orders
- `POST /api/orders/create` - Create new order
- `POST /api/orders/fill` - Fill/match orders
- `POST /api/orders/sync` - Trigger order sync
- `GET /api/orders/sync/status` - Get sync status

## Contract Interactions (Mocked)

### PIV Contract

- `totalOrders()` - Get total order count
- `placeOrder()` - Place new order
- `migrateFromAave()` - Migrate position from Aave
- `cancelOrder()` - Cancel existing order

### Router Contract

- `swap()` - Execute token swap

### Mock Transaction Behavior

- All transactions return mock transaction hashes
- Simulated network delays (0.5-3 seconds)
- 5% slippage applied to swaps
- 5% debt reduction in migrations

## Configuration Files

### Core Files

- `config/appConfig.ts` - Centralized configuration
- `lib/mockService.ts` - Mock implementations
- `lib/testUtils.ts` - Test utilities and scenarios
- `components/test-dashboard.tsx` - Interactive test interface

### Test Files

- `__tests__/swap.test.ts` - Swap functionality tests
- `__tests__/migration.test.ts` - Migration tests
- `__tests__/placeOrder.test.ts` - Order placement tests
- `__tests__/integration.test.ts` - End-to-end integration tests

## Key Features

### Mock Service Features

- **Persistent State**: Mock data persists during session
- **Realistic Delays**: Simulates network and blockchain delays
- **Error Simulation**: Can simulate network and contract errors
- **Multiple Scenarios**: Pre-configured test scenarios
- **Data Reset**: Easy reset of mock data

### Test Coverage

- ✅ Order creation and matching
- ✅ Token swapping with slippage
- ✅ Position migration with optimization
- ✅ Order cancellation
- ✅ Error handling and recovery
- ✅ Performance under load
- ✅ Data consistency across components

## Tips for Testing

1. **Use the Test Dashboard**: Start with the `/test` page for comprehensive testing
2. **Check Console**: Mock operations log detailed information to browser console
3. **Reset Data**: Use the "Reset Mock Data" button to start fresh
4. **Run Automated Tests**: Use Jest tests for regression testing
5. **Test Error Cases**: Try invalid inputs to test error handling

## Troubleshooting

### Common Issues

1. **Mock Mode Not Working**
   - Ensure `NEXT_PUBLIC_MOCK_MODE=true` in `.env.local`
   - Restart the development server after changing environment variables

2. **Tests Failing**
   - Check that Jest and testing dependencies are installed
   - Verify TypeScript configuration includes test files

3. **No Mock Data**
   - Visit the test dashboard and click "Reset Mock Data"
   - Check browser console for any JavaScript errors

### Debug Tips

- Open browser DevTools to see mock API calls and responses
- Check the test dashboard's mock data status
- Use the individual test buttons for step-by-step debugging

## Production Deployment

To disable mock mode for production:

1. Set `NEXT_PUBLIC_MOCK_MODE=false` or remove the variable
2. Configure real API and contract addresses
3. Ensure proper wallet integration

The application will automatically fall back to real API and contract calls when mock mode is disabled.
