# CollateralSwap Mock Mode 使用指南

这个文档描述了如何使用 CollateralSwap 的全局 mock 模式，让前端能够独立运行而不需要后端服务或区块链连接。

## 🎯 功能概述

新的 mock 系统提供了完整的数据流模拟，包括：

- ✅ **Aave 合约数据** - 模拟用户借贷位置
- ✅ **后端 API 接口** - 模拟订单管理接口  
- ✅ **PIV 合约接口** - 模拟 vault 位置和订单
- ✅ **迁移流程** - 完整的从 Aave 到 PIV 的迁移模拟
- ✅ **数据持久化** - 在会话期间保持状态一致性

## 🛠️ 配置

### 环境变量配置

在 `.env.local` 文件中设置：

```bash
# 全局 Mock 模式配置
NEXT_PUBLIC_MOCK_MODE=true           # 启用全局 mock 模式
NEXT_PUBLIC_USE_MOCK_AAVE=true       # 使用 Aave mock 数据
NEXT_PUBLIC_USE_MOCK_API=true        # 使用 API mock 数据  
NEXT_PUBLIC_USE_MOCK_CONTRACTS=true  # 使用合约 mock 数据
```

### 控制选项

- `NEXT_PUBLIC_MOCK_MODE=true` - 启用所有 mock 功能
- `NEXT_PUBLIC_USE_MOCK_AAVE=true` - 仅 mock Aave 数据
- `NEXT_PUBLIC_USE_MOCK_API=true` - 仅 mock 后端 API
- `NEXT_PUBLIC_USE_MOCK_CONTRACTS=true` - 仅 mock 智能合约调用

## 📊 Mock 数据结构

### Aave 位置数据

Mock 系统为每个用户地址创建以下 Aave 位置：

```typescript
- ETH 抵押品: 2.0000 ETH
- USDC 抵押品: 5000.0000 USDC  
- DAI 债务: 3000.0000 DAI
- USDT 债务: 1500.0000 USDT
```

### PIV Vault 位置

初始 PIV vault 包含：

```typescript
- WBTC 抵押品: 0.5000 WBTC
- LINK 债务: 500.0000 LINK
```

### 订单数据

Mock 订单簿包含多种类型的订单：

- 开放订单 (OPEN)
- 已完成订单 (FILLED)  
- 部分完成订单 (OPEN with filledAmount)
- 不同的代币对和价格

## 🔄 迁移流程演示

### 从 Aave 迁移到 Vault

1. **查看 Aave 位置** - 在 "AAVE Positions" 卡片中查看模拟位置
2. **点击 "Migrate to Vault"** - 选择要迁移的位置
3. **填写迁移详情**：
   - 选择目标代币
   - 输入迁移数量
   - 选择利率类型 (Stable/Variable)
4. **确认迁移** - 系统将：
   - 从 Aave 位置中移除该项
   - 在 PIV Vault 中创建新位置
   - 在订单列表中添加迁移订单

### 创建交换订单

1. **查看 PIV 位置** - 在 "PIV Vault Positions" 中查看位置
2. **点击 "Create Order"** - 为抵押品位置创建订单
3. **订单会自动添加到订单列表**

## 🎮 使用演示

### 完整迁移演示流程

```bash
1. 启动应用 (npm run dev)
2. 连接钱包 (会显示 mock 数据)
3. 查看 "AAVE Positions" - 应该看到 4 个位置
4. 点击任意位置的 "Migrate to Vault"
5. 在对话框中：
   - 保持默认的代币和数量
   - 选择 "Variable" 利率类型
   - 点击 "Confirm Migration"
6. 观察变化：
   - Aave 位置减少一个
   - PIV Vault 增加新位置  
   - Order List 增加新的迁移订单
7. 重复测试不同的位置和配置
```

## 🔧 开发者信息

### Mock 系统架构

```typescript
// 全局配置
mockData.ts          // Mock 数据存储和管理
├── MockDataStore    // 中央数据存储
├── MOCK_CONFIG      // 配置选项
└── 工具函数         // mockLog, mockDelay 等

// 服务层 Mock
aaveUtils.ts         // Aave 合约 mock
mockPivUtils.ts      // PIV 合约 mock  
migrationService.ts  // 迁移逻辑 mock
api.ts              // 后端 API mock
```

### 数据流

```text
用户操作 → Mock 服务 → MockDataStore → UI 更新
```

### 调试

启用 mock 日志查看详细操作：

```typescript
// 在浏览器控制台中查看
🔧 [MOCK AAVE] Creating mock positions
🔧 [MOCK PIV] Getting user PIV positions  
🔧 [MOCK API] Mock API request: GET /orders
🔧 [MOCK MIGRATION] Starting position migration
```

## 🚀 生产环境切换

要切换到真实环境，只需修改 `.env.local`：

```bash
# 禁用所有 mock
NEXT_PUBLIC_MOCK_MODE=false
NEXT_PUBLIC_USE_MOCK_AAVE=false  
NEXT_PUBLIC_USE_MOCK_API=false
NEXT_PUBLIC_USE_MOCK_CONTRACTS=false
```

## 📋 测试场景

### 测试清单

- [ ] **连接钱包** - 查看是否显示 mock 数据
- [ ] **Aave 位置显示** - 确认显示 4 个位置
- [ ] **PIV 位置显示** - 确认显示初始位置
- [ ] **订单列表** - 确认显示预填充订单
- [ ] **抵押品迁移** - 测试 ETH/USDC 位置迁移  
- [ ] **债务迁移** - 测试 DAI/USDT 位置迁移
- [ ] **数据一致性** - 迁移后数据正确更新
- [ ] **UI 响应** - 加载状态正确显示
- [ ] **错误处理** - 异常情况处理

### 性能测试

Mock 系统包含模拟网络延迟 (800ms)，测试：

- 加载状态显示
- 用户交互反馈  
- 数据更新时机

## 💡 最佳实践

1. **开发时启用完整 mock** - 快速迭代 UI/UX
2. **测试时混合模式** - 部分真实数据 + 部分 mock
3. **生产前关闭所有 mock** - 确保真实环境正常
4. **保留 mock 逻辑** - 方便演示和测试

## 🐛 故障排除

### 常见问题

**Q: 看不到 mock 数据？**
A: 检查 `.env.local` 配置和浏览器控制台 mock 日志

**Q: 迁移后数据没更新？**  
A: 确认 `MockDataStore` 正确管理状态

**Q: 订单列表为空？**
A: 检查 `NEXT_PUBLIC_USE_MOCK_API=true` 是否设置

**Q: 构建失败？**
A: 确认所有 mock 文件导入正确

### 日志调试

在控制台查看详细的 mock 操作日志，所有操作都会标记 `🔧 [MOCK SERVICE]`。

---

通过这个 mock 系统，前端开发者可以完全独立工作，测试完整的用户流程，无需等待后端或区块链环境。
