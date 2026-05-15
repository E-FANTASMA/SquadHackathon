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
app.use('/api/auth', authRoutes);
app.use('/api/company', payrollRoutes);
app.use('/api/worker', workerRoutes);
app.use('/api/payment', paymentRoutes);

// Routes placeholder
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the Payroll Verification System API' });
});

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP' });
});

module.exports = app;
