const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'smart-exam-secret-key-2026';

function requireAuth(req, res, next) {
  let token = null;

  // 1. فحص الهيدر Authorization: Bearer <token>
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  // 2. فحص الـ Query Param (مهم جداً لتحميل ملفات Excel والـ PDF المباشرة عبر روابط <a>)
  if (!token && req.query && req.query.token) {
    token = req.query.token;
  }

  // 3. فحص الهيدر المخصص
  if (!token && req.headers['x-access-token']) {
    token = req.headers['x-access-token'];
  }

  if (!token) {
    return res.status(401).json({ error: 'غير مصرح، يرجى تسجيل الدخول أولاً' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'جلسة الدخول منتهية أو غير صالحة' });
  }
}

function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'غير مسموح. هذه الصفحة مخصصة لمدير المنصة فقط (Super Admin).' });
    }
    next();
  });
}

function requireTeacher(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'TEACHER') {
      return res.status(403).json({ error: 'غير مسموح. هذه الصفحة مخصصة لحسابات المعلمين والسناتر فقط.' });
    }
    next();
  });
}

// فحص سريان اشتراك المعلم (حماية الـ 10% الخاصة بصاحب المنصة ومنع العمل بدون سداد)
async function requireActiveTeacher(req, res, next) {
  requireTeacher(req, res, async () => {
    try {
      const prisma = require('../prisma');
      const teacher = await prisma.teacher.findUnique({
        where: { id: req.user.id },
        select: { subscriptionStatus: true, subscriptionExpiresAt: true }
      });

      if (!teacher) {
        return res.status(404).json({ error: 'حساب المعلم غير موجود' });
      }

      const isExpired = teacher.subscriptionExpiresAt && new Date(teacher.subscriptionExpiresAt) < new Date();
      if (teacher.subscriptionStatus === 'EXPIRED' || (teacher.subscriptionStatus !== 'TRIAL' && isExpired)) {
        return res.status(403).json({
          error: 'انتهت فترة اشتراكك في المنصة. يرجى سداد عمولة المنصة (10%) عبر انستاباي أو فودافون كاش للاستمرار في إنشاء الامتحانات.',
          subscriptionExpired: true
        });
      }

      next();
    } catch (err) {
      next();
    }
  });
}

function requireStudent(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'STUDENT') {
      return res.status(403).json({ error: 'غير مسموح. هذه الصفحة مخصصة لحسابات الطلاب فقط.' });
    }
    next();
  });
}

module.exports = {
  requireAuth,
  requireAdmin,
  requireTeacher,
  requireActiveTeacher,
  requireStudent,
  JWT_SECRET
};
