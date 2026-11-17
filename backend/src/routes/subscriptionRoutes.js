const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { requireTeacher } = require('../middlewares/auth');

router.use(requireTeacher);

router.get('/', subscriptionController.getTeacherSubscription);
router.post('/pay', subscriptionController.submitPayment);
router.put('/pricing', subscriptionController.updateTeacherPricing);

module.exports = router;
