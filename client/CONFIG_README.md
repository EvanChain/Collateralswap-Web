# React客户端配置管理

React客户端的所有配置信息已经集中到 `config/appConfig.ts` 文件中，包括API地址、合约地址、代币配置等。

## 📁 新增文件结构

```
client/
├── config/
│   └── appConfig.ts          # 统一配置文件
├── lib/
│   └── api.ts               # API工具函数
├── hooks/
│   └── useAppConfig.ts      # 配置管理Hook
├── components/
│   └── config-status.tsx    # 配置状态组件
└── .env.example             # 环境变量模板
```

## ⚙️ 配置文件说明

### `config/appConfig.ts`

集中管理所有配置信息：

- **API_CONFIG**: 后端API配置
  - BASE_URL: 后端服务地址
  - ENDPOINTS: 所有API端点
  
- **CONTRACT_CONFIG**: 智能合约配置
  - PIV_ADDRESS: PIV合约地址
  - ROUTER_ADDRESS: Router合约地址
  - TOKENS: 代币地址映射
  - 网络配置

- **APP_CONFIG**: 应用设置
  - 滑点设置
  - 刷新间隔
  - UI配置

- **TOKEN_CONFIG**: 代币配置
  - 支持的代币列表
  - 代币元数据

- **CONTRACT_ABIS**: 合约ABI定义

### `lib/api.ts`

统一的API调用工具：

- **orderApi**: 订单相关API
  - getOrders(): 获取订单列表
  - createOrder(): 创建订单
  - fillOrder(): 撮合订单
  - syncOrders(): 手动同步
  - getSyncStatus(): 获取同步状态

- **apiUtils**: API工具函数
  - 错误处理
  - 重试机制
  - 错误格式化

### `hooks/useAppConfig.ts`

配置管理React Hook：

- **useAppConfig**: 配置验证
- **useWalletConnection**: 钱包连接状态

## 🔧 环境变量配置

复制 `.env.example` 到 `.env.local` 并配置：

```bash
# API配置
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000

# 合约地址
NEXT_PUBLIC_PIV_ADDRESS=0x...
NEXT_PUBLIC_ROUTER_ADDRESS=0x...

# 代币地址
NEXT_PUBLIC_USDC_ADDRESS=0x...
NEXT_PUBLIC_WETH_ADDRESS=0x...

# 网络配置
NEXT_PUBLIC_CHAIN_ID=1
NEXT_PUBLIC_NETWORK_NAME=mainnet
NEXT_PUBLIC_RPC_URL=https://mainnet.infura.io/v3/...
```

## 📝 已更新的组件

### `hooks/useIRouter.ts`

- 使用 `CONTRACT_CONFIG.ROUTER_ADDRESS`
- 使用 `CONTRACT_ABIS.IROUTER`

### `hooks/usePivOrderBook.ts`

- 使用 `CONTRACT_CONFIG.PIV_ADDRESS`
- 使用 `CONTRACT_ABIS.IPIV`

### `components/swap-page-content.tsx`

- 使用 `TOKEN_CONFIG.SUPPORTED_TOKENS`
- 使用 `orderApi.fillOrder()`
- 使用配置中的代币地址和精度

### `components/position-page-content.tsx`

- 使用 `orderApi.getOrders()`
- 使用统一的Order类型定义

## 🎯 使用方法

### 1. 导入配置

```typescript
import { 
  API_CONFIG, 
  CONTRACT_CONFIG, 
  TOKEN_CONFIG,
  getTokenBySymbol 
} from "../config/appConfig"
```

### 2. 使用API工具

```typescript
import { orderApi } from "../lib/api"

// 获取订单
const orders = await orderApi.getOrders()

// 创建订单
const order = await orderApi.createOrder(orderData)
```

### 3. 使用配置Hook

```typescript
import { useAppConfig, useWalletConnection } from "../hooks/useAppConfig"

function MyComponent() {
  const configStatus = useAppConfig()
  const { isConnected, connectWallet } = useWalletConnection()
  
  // 使用配置状态
}
```

### 4. 显示配置状态

```typescript
import { ConfigStatus } from "../components/config-status"

function App() {
  return (
    <div>
      <ConfigStatus />
      {/* 其他组件 */}
    </div>
  )
}
```

## ✅ 优势

1. **集中管理**: 所有配置在一个文件中
2. **类型安全**: TypeScript类型定义
3. **环境变量**: 支持不同环境配置
4. **错误处理**: 统一的API错误处理
5. **状态监控**: 配置验证和状态显示
6. **易于维护**: 修改配置只需要改一个地方

## 🚀 下一步

1. 配置实际的合约地址
2. 设置正确的后端API地址
3. 添加更多代币支持
4. 实现配置热更新
5. 添加配置管理界面

现在React客户端的所有配置都已经统一管理，可以通过修改配置文件和环境变量来适应不同的部署环境。
