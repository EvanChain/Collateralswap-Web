# CollateralSwap Server 测试套件

这是为 CollateralSwap Server 创建的完整测试套件，包含了对订单创建、列表和撮合功能的全面测试。

## 测试结构

```
server/
├── __tests__/                    # 测试目录
│   ├── models/                   # 模型测试
│   │   └── Order.test.js        # Order模型测试
│   ├── controllers/             # 控制器测试
│   │   └── orderController.test.js  # 订单控制器测试
│   ├── routes/                  # 路由测试
│   │   └── orderRoutes.test.js  # 订单路由测试
│   ├── integration/             # 集成测试
│   │   └── fullFlow.test.js     # 完整流程测试
│   ├── performance/             # 性能测试
│   │   └── performance.test.js  # 性能测试
│   ├── helpers/                 # 测试工具
│   │   └── testHelpers.js       # 测试辅助函数
│   └── simple.test.js           # 简化测试（可用）
├── __mocks__/                   # Mock文件
│   ├── web3.js                  # Web3 mock
│   ├── appConfig.js             # 配置文件 mock
│   └── IRouterAbi.json          # 合约ABI mock
├── jest.config.js               # Jest配置
├── jest.setup.js                # Jest设置
└── package.json                 # 包含测试脚本的依赖
```

## 功能覆盖

### 1. Order模型测试 (`__tests__/models/Order.test.js`)

- ✅ 创建订单成功
- ✅ 必填字段验证
- ✅ 状态枚举验证
- ✅ 数据类型验证

### 2. 订单控制器测试 (`__tests__/controllers/orderController.test.js`)

#### CreateOrder功能

- ✅ 成功创建订单
- ✅ 输入验证失败处理
- ✅ 字段缺失验证
- ✅ 数据类型验证

#### ListOrder功能

- ✅ 返回空数组（无订单时）
- ✅ 按创建时间降序排列
- ✅ 返回完整字段信息

#### FillOrder功能

- ✅ 成功撮合订单
- ✅ 部分成交处理
- ✅ 流动性不足处理
- ✅ 参数验证
- ✅ 无匹配订单处理
- ✅ 价格优先算法
- ✅ IRouter合约调用处理
- ✅ IPIV合约方法支持

### 3. 路由测试 (`__tests__/routes/orderRoutes.test.js`)

- ✅ POST /api/orders/create 路由
- ✅ POST /api/orders/fill 路由
- ✅ GET /api/orders/list 路由
- ✅ 无效路由处理
- ✅ 无效HTTP方法处理

### 4. 集成测试 (`__tests__/integration/fullFlow.test.js`)

- ✅ 完整订单生命周期测试
- ✅ 多次部分成交测试
- ✅ 跨token对场景
- ✅ 数据库连接异常处理
- ✅ 并发订单创建
- ✅ 大数据量性能测试
- ✅ 大数字BigInt计算

### 5. 性能测试 (`__tests__/performance/performance.test.js`)

- ✅ 订单创建性能
- ✅ 并发订单创建
- ✅ 大量订单列表性能
- ✅ 复杂撮合算法性能
- ✅ 内存泄漏检查
- ✅ 高负载压力测试

## Mock策略

### 1. MongoDB Mock

- 使用 `mongodb-memory-server` 提供内存数据库
- 每个测试后自动清理数据
- 支持完整的Mongoose功能

### 2. Web3 Mock

- Mock了Web3构造函数和合约调用
- 模拟swap方法返回预设值
- 支持成功和失败场景

### 3. 配置Mock

- Mock了应用配置文件
- 提供测试用的合约地址和RPC URL

## 运行测试

### 安装依赖

```bash
npm install
```

### 运行所有测试

```bash
npm test
```

### 运行特定测试文件

```bash
# 运行简化测试（推荐先运行此测试）
npx jest __tests__/simple.test.js --verbose

# 运行模型测试
npx jest __tests__/models/ --verbose

# 运行性能测试
npx jest __tests__/performance/ --verbose
```

### 运行测试覆盖率

```bash
npm run test:coverage
```

### 监听模式运行测试

```bash
npm run test:watch
```

## 测试特点

### 1. 全面性

- 覆盖了所有主要功能：createOrder, listOrder, fillOrder
- 包含正常流程和异常流程测试
- 涵盖边界条件和错误处理

### 2. 真实性

- 使用真实的MongoDB进行数据测试
- Mock了外部依赖（Web3、合约）
- 模拟真实的API请求和响应

### 3. 性能考虑

- 包含性能基准测试
- 内存使用监控
- 并发处理测试

### 4. 可维护性

- 测试工具函数复用
- 清晰的测试结构
- 详细的测试描述

## 核心测试场景

### 订单撮合算法测试

测试了复杂的订单撮合逻辑：

- 价格优先排序
- 时间优先排序
- 部分成交处理
- 订单状态更新
- BigInt精确计算

### 数据一致性测试

确保数据库操作的一致性：

- 订单创建后的状态
- 撮合后的数量更新
- 并发操作的数据完整性

### 错误处理测试

覆盖各种错误场景：

- 输入验证错误
- 数据库连接错误
- 合约调用失败
- 网络超时处理

## 注意事项

1. **简化测试优先**: 如果完整测试套件运行有问题，请先运行 `__tests__/simple.test.js`
2. **内存数据库**: 测试使用内存MongoDB，无需安装本地MongoDB
3. **Mock数据**: 所有外部依赖都已Mock，测试独立运行
4. **超时设置**: 部分测试可能需要较长时间，已设置适当超时

## 扩展建议

1. 添加更多边界条件测试
2. 增加安全性测试（SQL注入等）
3. 添加API文档测试
4. 集成CI/CD流水线
5. 添加E2E测试

这个测试套件为CollateralSwap Server提供了完整的质量保障，确保了订单管理系统的稳定性和可靠性。
