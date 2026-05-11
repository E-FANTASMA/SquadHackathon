const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authMiddleware, authorize } = require('../middleware/authMiddleware');

// Public route for webhooks (Squad will call this)
router.post('/webhook', paymentController.handleWebhook);

// Protected routes
router.use(authMiddleware);

router.post('/fund-batch', authorize(['company_admin']), paymentController.fundBatch);
router.post('/disburse', authorize(['company_admin']), paymentController.disburseSalaries);

module.exports = router;
