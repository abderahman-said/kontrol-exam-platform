const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const { requireAuth, requireActiveTeacher } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

// مسارات الطالب وولي الأمر العامة (بدون تسجيل دخول)
router.post('/student/join', examController.studentJoinExam);
router.post('/attempts/:attemptId/cheat-event', examController.logCheatEvent);
router.post('/attempts/:attemptId/submit', examController.submitExam);
router.get('/reports/parent/:attemptId', examController.getParentReport);

// مسارات المعلم المحمية بـ Auth وسريان الاشتراك
router.post('/ai-grade-essay', upload.single('answerImage'), examController.aiGradeEssay);
router.get('/', requireAuth, examController.getTeacherExams);
router.post('/', requireActiveTeacher, upload.single('pdfFile'), examController.createExam);
router.get('/:id', requireAuth, examController.getExamDetails);
router.get('/:id/export-excel', requireAuth, examController.exportToExcel);
router.post('/:id/omr-scan', requireAuth, examController.omrScanSubmit);

module.exports = router;
