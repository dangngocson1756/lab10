const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();

// Enable CORS
app.use(cors());

// Environment variables for service URLs
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002';
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:3003';

console.log('Service URLs:');
console.log('User Service:', USER_SERVICE_URL);
console.log('Product Service:', PRODUCT_SERVICE_URL);
console.log('Order Service:', ORDER_SERVICE_URL);

// Check one service
const checkService = async (name, url) => {
    try {
        const response = await fetch(`${url}/health`, { signal: AbortSignal.timeout(15000) });
        return { status: response.ok ? 'healthy' : 'unhealthy', url };
    } catch (error) {
        return { status: 'unhealthy', url, error: error.message };
    }
};

// Health check endpoint
app.get('/health', async (req, res) => {
    const [userService, productService, orderService] = await Promise.all([
        checkService('user', USER_SERVICE_URL),
        checkService('product', PRODUCT_SERVICE_URL),
        checkService('order', ORDER_SERVICE_URL)
    ]);

    res.json({
        gateway: { status: 'healthy', timestamp: new Date().toISOString() },
        services: { userService, productService, orderService }
    });
});

// Proxy configuration with error handling
const createProxyWithErrorHandling = (target) => {
    return createProxyMiddleware({
        target,
        changeOrigin: true,
        timeout: 20000,
        proxyTimeout: 20000,
        onError: (err, req, res) => {
            console.error(`Proxy error for ${req.url}:`, err.message);
            res.status(503).json({
                error: 'Service temporarily unavailable',
                service: target,
                timestamp: new Date().toISOString()
            });
        },
        onProxyReq: (proxyReq, req, res) => {
            console.log(`Proxying ${req.method} ${req.originalUrl} to ${target}`);
        }
    });
};

// Proxy for each service (no pathRewrite: services already expose /users, /products, /orders)
app.use('/users', createProxyWithErrorHandling(USER_SERVICE_URL));
app.use('/products', createProxyWithErrorHandling(PRODUCT_SERVICE_URL));
app.use('/orders', createProxyWithErrorHandling(ORDER_SERVICE_URL));

// Default route
app.get('/', (req, res) => {
    res.json({
        message: 'Microservices API Gateway',
        version: '1.0.0',
        services: {
            userService: USER_SERVICE_URL,
            productService: PRODUCT_SERVICE_URL,
            orderService: ORDER_SERVICE_URL
        },
        endpoints: [
            'GET /users - Get all users',
            'POST /users - Create user',
            'GET /products - Get all products',
            'POST /products - Create product',
            'GET /orders - Get all orders',
            'POST /orders - Create order',
            'GET /health - Health check all services'
        ],
        timestamp: new Date().toISOString()
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`API Gateway running on port ${PORT}`);
});