# Order Synchronization Service

这个服务负责从区块链上的PIV合约同步订单数据到MongoDB数据库。

## 功能特性

- **定时同步**: 每分钟自动从链上同步订单数据
- **事件监听**: 监听PIV合约的OrderPlaced、OrderCancelled、OrderTraded事件
- **增量更新**: 只更新变化的订单，删除不再存在的订单
- **手动触发**: 提供API接口手动触发同步
- **状态监控**: 提供同步状态查询接口

## 配置

### 环境变量

复制 `.env.example` 到 `.env` 并配置以下变量：

```bash
# Web3 配置
WEB3_PROVIDER_URL=https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID

# 合约地址
PIV_ADDRESS=0x1234567890123456789012345678901234567890
ORDER_BOOK_ADDRESS=0x1234567890123456789012345678901234567890

# MongoDB 配置
MONGODB_URI=mongodb://localhost:27017/collateralswap

# 同步配置
ENABLE_ORDER_SYNC=true
```

### 数据库模型更新

Order模型已更新，增加了以下字段：

- `orderId`: 链上订单ID（唯一）
- `interestRateMode`: 利率模式
- `isFromBlockchain`: 标识是否来自区块链

## API 接口

### 手动触发同步

```
POST /api/orders/sync
```

### 查询同步状态

```
GET /api/orders/sync/status
```

响应示例：

```json
{
  "isRunning": false,
  "pivAddress": "0x1234567890123456789012345678901234567890",
  "contractInitialized": true
}
```

## 工作原理

1. **初始化**: 服务启动时初始化Web3连接和PIV合约实例
2. **事件获取**: 通过`getPastEvents`获取所有历史事件
3. **数据处理**:
   - 解析OrderPlaced事件获取订单详情
   - 处理OrderCancelled事件更新订单状态
   - 处理OrderTraded事件更新成交数量
4. **数据库同步**:
   - 使用`findOneAndUpdate`的`upsert`选项创建或更新订单
   - 删除链上不再存在的订单
5. **定时执行**: 使用node-cron每分钟执行一次同步

## 注意事项

### 合约ABI限制

当前PIV合约ABI中没有直接获取订单详情的函数，同步服务通过监听事件来重建订单状态。这可能导致：

- 需要从创世块开始扫描所有事件（首次同步较慢）
- 如果事件日志被清理，可能丢失历史数据

### 性能考虑

- 大量历史事件可能导致同步缓慢
- 考虑实现增量同步（保存最后同步的区块号）
- 可以考虑使用事件过滤器减少网络请求

### 错误处理

- 网络连接失败时会跳过本次同步
- 合约调用失败会记录错误日志
- 数据库操作失败会记录错误但不会中断其他订单的处理

## 扩展建议

1. **增量同步**: 保存最后同步的区块号，只处理新事件
2. **事件缓存**: 缓存已处理的事件，避免重复处理
3. **批量操作**: 使用MongoDB的批量操作提高性能
4. **监控告警**: 添加同步失败告警机制
5. **数据校验**: 添加链上数据与数据库数据的一致性校验

## 测试

运行测试：

```bash
npm test
```

针对同步服务的测试：

```bash
npm test -- __tests__/services/orderSyncService.test.js
```

## 日志

同步服务会输出以下日志：

- 合约初始化状态
- 每次同步的处理结果
- 错误信息和异常情况
- 定时任务执行状态
