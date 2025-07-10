const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config(); // 加载环境变量
const orderRoutes = require('./routes/orderRoutes');
const orderSyncService = require('./services/orderSyncService');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/collateralswap';
mongoose.connect(mongoUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');

    // 启动订单同步服务
    if (process.env.ENABLE_ORDER_SYNC !== 'false') {
        console.log('Starting order synchronization service...');
        orderSyncService.startScheduledSync();
    } else {
        console.log('Order synchronization service is disabled');
    }
}).catch((error) => {
    console.error('MongoDB connection error:', error);
});

// Routes
app.use('/api/orders', orderRoutes);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});


