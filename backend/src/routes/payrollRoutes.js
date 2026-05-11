const express = require('express');
const router = express.Router();
const multer = require('multer');
const payrollController = require('../controllers/payrollController');
const { authMiddleware, authorize } = require('../middleware/authMiddleware');

const upload = multer({ storage: multer.memoryStorage() });

// All routes here require authentication and company_admin role
router.use(authMiddleware);
router.use(authorize(['company_admin']));

router.post('/upload-payroll', upload.single('payroll_file'), payrollController.uploadPayroll);
router.get('/payroll-batches', payrollController.getPayrollBatches);
router.get('/batch-workers/:batchId', payrollController.getBatchWorkers);
router.post('/update-worker-status', payrollController.updateWorkerStatus);

module.exports = router;
