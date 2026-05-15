const express = require('express');
const router = express.Router();
const multer = require('multer');
const workerController = require('../controllers/workerController');
const { authMiddleware, authorize } = require('../middleware/authMiddleware');

const upload = multer({ storage: multer.memoryStorage() });

// All routes here require authentication and worker role
router.use(authMiddleware);
router.use(authorize(['worker']));

router.post('/claim-record', workerController.claimRecord);
router.post('/upload-documents', upload.fields([
    { name: 'statement', maxCount: 1 },
    { name: 'screenshot', maxCount: 1 }
]), workerController.uploadDocuments);
router.post('/submit-documents', upload.fields([
    { name: 'statement', maxCount: 1 },
    { name: 'screenshot', maxCount: 1 }
]), workerController.uploadDocuments); // Alias for frontend
router.get('/status', workerController.getStatus);

module.exports = router;
