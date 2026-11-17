const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { requireStudent } = require('../middlewares/auth');

router.post('/login', studentController.studentLogin);
router.get('/dashboard', requireStudent, studentController.getStudentDashboard);
router.post('/ai-explain', requireStudent, studentController.aiExplainQuestion);
router.post('/ai-chat', requireStudent, studentController.aiChat);
router.get('/ai-status', studentController.getAIStatus);
router.post('/ai-config', studentController.saveAIConfig);

module.exports = router;
