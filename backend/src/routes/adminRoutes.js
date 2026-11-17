const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAdmin } = require('../middlewares/auth');

// حماية مسارات الأدمن الصارمة
router.use(requireAdmin);

router.get('/stats', adminController.getPlatformStats);
router.get('/teachers', adminController.getAllTeachers);
router.get('/payments', adminController.getSubscriptionPayments);
router.patch('/payments/:id/status', adminController.updatePaymentStatus);

module.exports = router;
