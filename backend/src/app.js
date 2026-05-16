const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const authRoutes = require('./routes/authRoutes');
const payrollRoutes = require('./routes/payrollRoutes');
const workerRoutes = require('./routes/workerRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const mountRoutes = (base) => {
    app.use(`${base}/auth`, authRoutes);
    app.use(`${base}/company`, payrollRoutes);
    app.use(`${base}/worker`, workerRoutes);
    app.use(`${base}/payment`, paymentRoutes);
};

// Mount at both /api and root for flexibility
mountRoutes('/api');
mountRoutes('');

// Routes placeholder
app.get('/', (req, res) => {
    res.json({ 
        message: 'Welcome to the PayGuard AI API',
        endpoints: ['/api/auth', '/api/company', '/api/worker', '/api/payment']
    });
});

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP' });
});

module.exports = app;
