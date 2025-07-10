# CollateralSwap 前端配置重构完成

## 🎯 已完成的配置集中化

### ✅ 新增配置文件

1. **`config/appConfig.ts`** - 统一配置管理中心
   - API配置（后端地址、端点）
   - 合约配置（地址、ABI）
   - 应用配置（滑点、刷新间隔）
   - 代币配置（支持列表、元数据）

2. **`.env.example`** - 环境变量模板
   - 后端API地址
   - 合约地址
   - 代币地址
   - 网络配置

3. **`lib/api.ts`** - API调用工具
   - 统一的API接口
   - 错误处理机制
   - 类型安全的请求/响应

4. **`hooks/useAppConfig.ts`** - 配置管理Hook
   - 配置验证
   - 钱包连接状态管理

5. **`components/config-status.tsx`** - 配置状态显示组件

### ✅ 已更新的文件

1. **`hooks/useIRouter.ts`**
   - 使用配置文件中的Router地址和ABI
   - 移除硬编码的合约信息

2. **`hooks/usePivOrderBook.ts`**
   - 使用配置文件中的PIV地址和ABI
   - 移除硬编码的合约信息

3. **`components/swap-page-content.tsx`**
   - 使用配置中的代币列表
   - 使用API工具函数
   - 使用正确的代币精度

4. **`components/position-page-content.tsx`**
   - 使用API工具获取订单
   - 使用统一的类型定义

5. **`components/coll-swap.tsx`**
   - 修复OrderBook组件props

## 📋 配置项目详细说明

### API配置 (API_CONFIG)

```typescript
{
  BASE_URL: 'http://localhost:5000',
  ENDPOINTS: {
    ORDER_CREATE: '/api/orders/create',
    ORDER_LIST: '/api/orders/list',
    ORDER_FILL: '/api/orders/fill',
    ORDER_SYNC: '/api/orders/sync',
    ORDER_SYNC_STATUS: '/api/orders/sync/status'
  }
}
```

### 合约配置 (CONTRACT_CONFIG)

```typescript
{
  PIV_ADDRESS: process.env.NEXT_PUBLIC_PIV_ADDRESS,
  ROUTER_ADDRESS: process.env.NEXT_PUBLIC_ROUTER_ADDRESS,
  TOKENS: {
    USDC: process.env.NEXT_PUBLIC_USDC_ADDRESS,
    WETH: process.env.NEXT_PUBLIC_WETH_ADDRESS
  },
  CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID,
  RPC_URL: process.env.NEXT_PUBLIC_RPC_URL
}
```

### 代币配置 (TOKEN_CONFIG)

```typescript
{
  SUPPORTED_TOKENS: [
    {
      symbol: 'USDC',
      name: 'USD Coin',
      address: CONTRACT_CONFIG.TOKENS.USDC,
      decimals: 6,
      icon: '/icons/usdc.png'
    },
    // ...更多代币
  ]
}
```

## 🛠 使用方式

### 1. 环境配置

```bash
# 复制模板
cp .env.example .env.local

# 编辑配置
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
NEXT_PUBLIC_PIV_ADDRESS=0x...
NEXT_PUBLIC_ROUTER_ADDRESS=0x...
```

### 2. 导入配置

```typescript
import { 
  CONTRACT_CONFIG, 
  TOKEN_CONFIG, 
  getTokenBySymbol 
} from "../config/appConfig"
```

### 3. 使用API工具

```typescript
import { orderApi } from "../lib/api"

// 获取订单
const orders = await orderApi.getOrders()

// 撮合订单
const result = await orderApi.fillOrder({
  tokenIn: '0x...',
  tokenOut: '0x...',
  amountIn: '1000000',
  minAmountOut: '950000'
})
```

### 4. 配置验证

```typescript
import { useAppConfig } from "../hooks/useAppConfig"

function App() {
  const configStatus = useAppConfig()
  
  if (!configStatus.isValid) {
    return <div>配置错误：{configStatus.errors.join(', ')}</div>
  }
  
  return <YourApp />
}
```

## 📊 优势总结

1. **集中管理** - 所有配置在一个地方
2. **类型安全** - TypeScript类型保护
3. **环境隔离** - 不同环境不同配置
4. **错误处理** - 统一的错误处理机制
5. **易于维护** - 修改配置只需改一处
6. **配置验证** - 运行时配置检查
7. **开发体验** - 更好的开发者体验

## 🚀 下一步

1. **部署配置**
   - 设置生产环境的合约地址
   - 配置正确的后端API地址

2. **功能扩展**
   - 添加更多代币支持
   - 实现网络切换功能
   - 添加配置管理界面

3. **优化改进**
   - 实现配置热重载
   - 添加配置缓存机制
   - 优化错误提示信息

现在React客户端的配置已经完全集中化管理，可以轻松适应不同的部署环境和需求变更！
