# Aave Contract Integration

本文档描述了如何使用新的基于合约的 Aave 工具来获取用户的借贷头寸。

## 概述

`aaveUtils.ts` 现在使用以下 Aave 官方库直接从合约读取数据：

- `@aave/contract-helpers` - 提供与 Aave 合约交互的辅助函数
- `@aave/math-utils` - 提供用于格式化和计算 Aave 数据的数学工具  
- `@bgd-labs/aave-address-book` - 提供所有网络上的 Aave 合约地址

## 主要特性

- ✅ 直接从 Aave V3 Sepolia 合约读取数据
- ✅ 使用官方 Aave 库确保数据准确性
- ✅ 处理 BigNumber 溢出预防
- ✅ 支持用户提供的 provider 或默认 RPC provider
- ✅ 强健的错误处理和开发模式回退
- ✅ TypeScript 类型安全

## 基本用法

### 1. 使用默认 RPC Provider

```typescript
import { getAaveUtils } from '../lib/aaveUtils';

async function fetchUserPositions(userAddress: string) {
    // 使用配置中的默认 RPC provider
    const aaveUtils = await getAaveUtils();
    
    if (aaveUtils) {
        const positions = await aaveUtils.getUserAavePositions(userAddress);
        console.log('User positions:', positions);
        return positions;
    }
    
    return [];
}
```

### 2. 使用自定义 Provider

```typescript
import { ethers } from 'ethers';
import { getAaveUtils } from '../lib/aaveUtils';

async function fetchUserPositionsWithProvider(userAddress: string, provider: ethers.providers.Provider) {
    // 使用用户提供的 provider（例如 MetaMask）
    const aaveUtils = await getAaveUtils(provider);
    
    if (aaveUtils) {
        const positions = await aaveUtils.getUserAavePositions(userAddress);
        return positions;
    }
    
    return [];
}
```

### 3. 在 React 组件中使用

```typescript
import { useWallet } from '../hooks/useWallet';
import { getAaveUtils } from '../lib/aaveUtils';

function MyComponent() {
    const { provider, address } = useWallet();
    const [positions, setPositions] = useState([]);
    
    useEffect(() => {
        if (address) {
            fetchPositions();
        }
    }, [address, provider]);
    
    async function fetchPositions() {
        try {
            const aaveUtils = await getAaveUtils(provider || undefined);
            if (aaveUtils && address) {
                const userPositions = await aaveUtils.getUserAavePositions(address);
                setPositions(userPositions);
            }
        } catch (error) {
            console.error('Error fetching positions:', error);
        }
    }
    
    return (
        <div>
            {positions.map(position => (
                <div key={position.id}>
                    {position.type}: {position.formattedAmount} {position.token}
                </div>
            ))}
        </div>
    );
}
```

## 数据结构

### AavePosition 接口

```typescript
export interface AavePosition {
    id: string;              // 唯一标识符
    type: 'collateral' | 'debt'; // 头寸类型
    token: string;           // 代币符号 (例如: 'ETH', 'USDC')
    amount: string;          // 原始数量 (wei/最小单位)
    formattedAmount: string; // 格式化后的数量 (人类可读)
    tokenAddress: string;    // 代币合约地址
}
```

## 网络配置

当前配置用于 **Sepolia 测试网**：

- Chain ID: `11155111`
- 使用 `@bgd-labs/aave-address-book` 中的 `AaveV3Sepolia` 地址
- 默认 RPC: `https://api.zan.top/node/v1/eth/sepolia/e6bd8c0b823d40bc88306c09ee218515`

## 错误处理

工具包含完善的错误处理：

1. **网络错误**: 自动重试和降级处理
2. **BigNumber 溢出**: 预防性检查以避免计算溢出
3. **合约调用失败**: 在开发模式下提供示例数据
4. **无效地址**: 地址格式验证

## 调试

设置环境变量以启用详细日志：

```bash
NODE_ENV=development
```

在开发模式下，如果合约调用失败，工具会：

- 记录详细的错误信息
- 返回示例数据以便继续开发
- 显示清晰的控制台消息

## 测试

使用提供的测试工具验证集成：

```typescript
import { testAaveContractIntegration, testAaveWithCustomProvider } from '../lib/testAaveContracts';

// 测试默认配置
await testAaveContractIntegration();

// 测试自定义 provider
await testAaveWithCustomProvider(provider, userAddress);
```

## 配置

主要配置在 `appConfig.ts` 中：

```typescript
// RPC 配置
RPC_URL: process.env.NEXT_PUBLIC_RPC_URL || 'https://api.zan.top/node/v1/eth/sepolia/...',

// Aave V3 Sepolia 配置（通过 address book 自动处理）
AAVE_POOL_ADDRESSES_PROVIDER: '0x012bAC54348C0E635dCAc9D5FB99f06F24136C9A',
AAVE_UI_POOL_DATA_PROVIDER: '0x69529987FA4A075D0C00B0128fa848dc9ebbE9CE',
```

## 迁移指南

如果你之前使用 API 版本的 aaveUtils：

1. **更新导入**: 无需更改，API 保持相同
2. **更新调用**: `getAaveUtils()` 现在可选接受 provider 参数  
3. **更新错误处理**: 错误消息可能略有不同
4. **测试**: 使用新的测试工具验证集成

## 故障排除

### 常见问题

1. **"Cannot read properties of undefined"**
   - 确保 provider 已正确初始化
   - 检查网络连接

2. **"Invalid address"**
   - 验证用户地址格式正确
   - 确保地址是有效的以太坊地址

3. **"RPC errors"**
   - 检查 RPC URL 配置
   - 验证网络连接
   - 考虑使用不同的 RPC 提供商

4. **"No positions found"**
   - 确认用户在 Aave V3 Sepolia 上有头寸
   - 检查用户地址是否正确
   - 在开发模式下会显示示例数据

### 获取帮助

查看控制台日志以获取详细的调试信息。所有重要操作都会记录到控制台。
