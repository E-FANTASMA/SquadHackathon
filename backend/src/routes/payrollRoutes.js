const express = require('express');
const router = express.Router();
const multer = require('multer');
const payrollController = require('../controllers/payrollController');
const { authMiddleware, authorize } = require('../middleware/authMiddleware');

const upload = multer({ storage: multer.memoryStorage() });

// All routes here require authentication and company_admin role
router.use(authMiddleware);
router.use(authorize(['company_admin']));

// Standard Payroll Routes
router.post('/upload-payroll', upload.single('payroll_file'), payrollController.uploadPayroll);
router.get('/payroll-batches', payrollController.getPayrollBatches);
router.get('/batch-workers/:batchId', payrollController.getBatchWorkers);
router.post('/update-worker-status', payrollController.updateWorkerStatus);

// PayGuard AI & Squad Integration Routes
router.post('/create-virtual-account', payrollController.createVirtualAccount);
router.post('/initiate-funding', payrollController.initiateFunding);
router.post('/simulate-funding', payrollController.simulateFunding);
router.post('/disburse', payrollController.disburse);
router.get('/verify/:reference', payrollController.verifyTransfer);

module.exports = router;
