// API utility functions for CollateralSwap DApp
import { API_CONFIG, formatApiUrl } from '../config/appConfig'
import { MOCK_CONFIG, mockLog, mockDelay, mockDataStore } from './mockData'

// Types for API responses
export interface Order {
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

export interface FillOrderRequest {
    tokenIn: string
    tokenOut: string
    amountIn: string
    minAmountOut: string
}

export interface FillOrderResponse {
    totalIn: string
    totalOut: string
    matchDetails: Array<{
        orderId: string
        fillIn: string
        fillOut: string
        price: string
    }>
    swapNetAmountOut?: string
    swapTotalInputAmount?: string
}

export interface CreateOrderRequest {
    owner: string
    collateralToken: string
    debtToken: string
    collateralAmount: string
    price: string
}

export interface SyncStatusResponse {
    isRunning: boolean
    pivAddress: string
    contractInitialized: boolean
}

// API error handling
class ApiError extends Error {
    constructor(
        message: string,
        public status: number,
        public data?: any
    ) {
        super(message)
        this.name = 'ApiError'
    }
}

// Generic API request function
async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    // Check if we should use mock data
    if (MOCK_CONFIG.GLOBAL_MOCK_MODE || MOCK_CONFIG.USE_MOCK_API) {
        mockLog('API', `Mock API request: ${endpoint}`, options);
        await mockDelay();
        return handleMockApiRequest<T>(endpoint, options);
    }

    const url = formatApiUrl(endpoint)

    const defaultOptions: RequestInit = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    }

    const config = { ...defaultOptions, ...options }

    try {
        const response = await fetch(url, config)

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new ApiError(
                errorData.message || `HTTP ${response.status}: ${response.statusText}`,
                response.status,
                errorData
            )
        }

        return await response.json()
    } catch (error) {
        if (error instanceof ApiError) {
            throw error
        }

        // Network or other errors
        throw new ApiError(
            error instanceof Error ? error.message : 'Network error',
            0
        )
    }
}

// Mock API request handler
function handleMockApiRequest<T>(endpoint: string, options: RequestInit): T {
    const method = options.method || 'GET';
    mockLog('API', `Handling mock request: ${method} ${endpoint}`, options);

    // Handle different endpoints
    if (endpoint.includes('/orders/list') || endpoint.includes('/orders')) {
        if (method === 'GET') {
            return mockDataStore.getOrders() as T;
        }
    }

    if (endpoint.includes('/orders/create')) {
        if (method === 'POST') {
            const body = options.body ? JSON.parse(options.body as string) : {};
            const newOrder: Order = {
                _id: `mock-${Date.now()}`,
                orderId: `ORDER_${Date.now()}`,
                ...body,
                status: 'OPEN' as const,
                filledAmount: '0',
                isFromBlockchain: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            mockDataStore.addOrder(newOrder);
            return newOrder as T;
        }
    }

    if (endpoint.includes('/orders/fill')) {
        if (method === 'POST') {
            const body = options.body ? JSON.parse(options.body as string) : {};
            const mockResponse: FillOrderResponse = {
                totalIn: body.amountIn || '1000',
                totalOut: body.minAmountOut || '900',
                matchDetails: [
                    {
                        orderId: 'mock-order-1',
                        fillIn: body.amountIn || '1000',
                        fillOut: body.minAmountOut || '900',
                        price: '0.9'
                    }
                ],
                swapNetAmountOut: body.minAmountOut || '900',
                swapTotalInputAmount: body.amountIn || '1000'
            };
            return mockResponse as T;
        }
    }

    if (endpoint.includes('/orders/sync/status')) {
        if (method === 'GET') {
            const syncStatus: SyncStatusResponse = {
                isRunning: false,
                pivAddress: '0x1234567890123456789012345678901234567890',
                contractInitialized: true
            };
            return syncStatus as T;
        }
    }

    if (endpoint.includes('/orders/sync')) {
        if (method === 'POST') {
            return { message: 'Sync started successfully' } as T;
        }
    }

    // Default response for unhandled endpoints
    mockLog('API', `Unhandled mock endpoint: ${method} ${endpoint}`);
    return {} as T;
}

// Order API functions
export const orderApi = {
    // Get all orders
    async getOrders(userAddress?: string): Promise<Order[]> {
        if (MOCK_CONFIG.GLOBAL_MOCK_MODE || MOCK_CONFIG.USE_MOCK_API) {
            await mockDelay();
            return mockDataStore.getOrders(userAddress);
        }
        return apiRequest<Order[]>(API_CONFIG.ENDPOINTS.ORDER_LIST)
    },

    // Create new order
    async createOrder(orderData: CreateOrderRequest): Promise<Order> {
        return apiRequest<Order>(API_CONFIG.ENDPOINTS.ORDER_CREATE, {
            method: 'POST',
            body: JSON.stringify(orderData),
        })
    },

    // Fill orders (matching algorithm)
    async fillOrder(fillData: FillOrderRequest): Promise<FillOrderResponse> {
        return apiRequest<FillOrderResponse>(API_CONFIG.ENDPOINTS.ORDER_FILL, {
            method: 'POST',
            body: JSON.stringify(fillData),
        })
    },

    // Manual sync trigger
    async syncOrders(): Promise<{ message: string }> {
        return apiRequest<{ message: string }>(API_CONFIG.ENDPOINTS.ORDER_SYNC, {
            method: 'POST',
        })
    },

    // Get sync status
    async getSyncStatus(): Promise<SyncStatusResponse> {
        return apiRequest<SyncStatusResponse>(API_CONFIG.ENDPOINTS.ORDER_SYNC_STATUS)
    },

    // Update order price (Mock implementation for now)
    async updateOrder(orderId: string, updateData: { price: string }): Promise<Order> {
        if (MOCK_CONFIG.GLOBAL_MOCK_MODE || MOCK_CONFIG.USE_MOCK_API) {
            await mockDelay();
            const success = mockDataStore.updateOrderPrice(orderId, updateData.price);
            if (success) {
                const orders = mockDataStore.getOrders();
                const updatedOrder = orders.find(o => o._id === orderId);
                if (updatedOrder) {
                    return updatedOrder;
                }
            }
            throw new Error('Order not found or update failed');
        }

        // Real API call would go here
        return apiRequest<Order>(`/orders/${orderId}`, {
            method: 'PUT',
            body: JSON.stringify(updateData),
        });
    },

    // Cancel order (Mock implementation for now)
    async cancelOrder(orderId: string): Promise<{ message: string }> {
        if (MOCK_CONFIG.GLOBAL_MOCK_MODE || MOCK_CONFIG.USE_MOCK_API) {
            await mockDelay();
            const success = mockDataStore.cancelOrder(orderId);
            if (success) {
                return { message: 'Order cancelled successfully' };
            }
            throw new Error('Order not found or cancellation failed');
        }

        // Real API call would go here
        return apiRequest<{ message: string }>(`/orders/${orderId}`, {
            method: 'DELETE',
        });
    },
}

// Utility functions for common API patterns
export const apiUtils = {
    // Format error message for display
    formatError(error: unknown): string {
        if (error instanceof ApiError) {
            return error.message
        }
        if (error instanceof Error) {
            return error.message
        }
        return 'An unexpected error occurred'
    },

    // Check if error is a specific HTTP status
    isHttpError(error: unknown, status: number): boolean {
        return error instanceof ApiError && error.status === status
    },

    // Retry API call with exponential backoff
    async retry<T>(
        fn: () => Promise<T>,
        maxRetries: number = 3,
        baseDelay: number = 1000
    ): Promise<T> {
        let lastError: unknown

        for (let i = 0; i <= maxRetries; i++) {
            try {
                return await fn()
            } catch (error) {
                lastError = error

                if (i === maxRetries) {
                    break
                }

                // Don't retry client errors (4xx)
                if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
                    break
                }

                const delay = baseDelay * Math.pow(2, i)
                await new Promise(resolve => setTimeout(resolve, delay))
            }
        }

        throw lastError
    },
}

export { ApiError }
