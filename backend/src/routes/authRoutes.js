const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAuth } = require('../middlewares/auth');

// بوابات الدخول المنفصلة
router.post('/teacher/login', authController.teacherLogin);
router.post('/teacher/register', authController.teacherRegister);
router.post('/admin/login', authController.adminLogin);
router.post('/student/login', authController.studentLogin);

// مسارات متوافقة
router.post('/login', authController.teacherLogin);
router.post('/register', authController.teacherRegister);

// فحص الجلسة الحالية
router.get('/me', requireAuth, authController.getMe);

module.exports = router;
