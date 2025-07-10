# 快速启动指南

## 1. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置以下必要参数：

```bash
# 必须配置的参数
WEB3_PROVIDER_URL=https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID
PIV_ADDRESS=0xYourPIVContractAddress
```

## 2. 启动服务器

```bash
npm start
```

服务器启动后会自动：

- 连接MongoDB数据库
- 初始化PIV合约连接
- 开始每分钟执行一次订单同步

## 3. 测试同步功能

### 手动触发同步

```bash
curl -X POST http://localhost:5000/api/orders/sync
```

### 查看同步状态

```bash
curl http://localhost:5000/api/orders/sync/status
```

### 查看所有订单

```bash
curl http://localhost:5000/api/orders/list
```

## 4. 监控日志

服务器控制台会显示：

- MongoDB连接状态
- 同步服务启动信息
- 每次同步的执行结果
- 任何错误信息

## 5. 禁用自动同步

如果需要临时禁用自动同步，设置环境变量：

```bash
ENABLE_ORDER_SYNC=false
```

然后重启服务器。你仍然可以通过API手动触发同步。
