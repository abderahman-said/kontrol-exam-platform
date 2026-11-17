const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma');
const { JWT_SECRET } = require('../middlewares/auth');

// ==================== 1. المعلم والسنتر ====================
exports.teacherRegister = async (req, res) => {
  try {
    const { name, phone, password, centerName } = req.body;
    if (!name || !phone || !password) {
      return res.status(400).json({ error: 'يرجى إدخال الاسم ورقم الموبايل وكلمة المرور' });
    }

    const existing = await prisma.teacher.findUnique({ where: { phone } });
    if (existing) {
      return res.status(400).json({ error: 'رقم الموبايل مسجل مسبقاً، يرجى تسجيل الدخول' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const oneMonthLater = new Date();
    oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

    const teacher = await prisma.teacher.create({
      data: {
        name,
        phone,
        passwordHash,
        centerName: centerName || '',
        role: 'TEACHER',
        subscriptionStatus: 'ACTIVE',
        subscriptionExpiresAt: oneMonthLater
      }
    });

    const token = jwt.sign(
      { id: teacher.id, name: teacher.name, phone: teacher.phone, role: 'TEACHER' },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.status(201).json({
      message: 'تم إنشاء حساب المعلم بنجاح',
      token,
      user: { id: teacher.id, name: teacher.name, phone: teacher.phone, centerName: teacher.centerName, role: 'TEACHER' }
    });
  } catch (err) {
    console.error('Teacher register error:', err);
    return res.status(500).json({ error: 'حدث خطأ في الخادم أثناء تسجيل المعلم' });
  }
};

exports.teacherLogin = async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ error: 'يرجى إدخال رقم الموبايل وكلمة المرور' });
    }

    const teacher = await prisma.teacher.findUnique({ where: { phone } });
    if (!teacher) {
      return res.status(400).json({ error: 'بيانات الدخول غير صحيحة' });
    }

    const isMatch = await bcrypt.compare(password, teacher.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'بيانات الدخول غير صحيحة' });
    }

    const token = jwt.sign(
      { id: teacher.id, name: teacher.name, phone: teacher.phone, role: 'TEACHER' },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.json({
      message: 'تم تسجيل دخول المعلم بنجاح',
      token,
      user: {
        id: teacher.id,
        name: teacher.name,
        phone: teacher.phone,
        centerName: teacher.centerName,
        subscriptionStatus: teacher.subscriptionStatus,
        role: 'TEACHER'
      }
    });
  } catch (err) {
    console.error('Teacher login error:', err);
    return res.status(500).json({ error: 'حدث خطأ أثناء تسجيل دخول المعلم' });
  }
};

// ==================== 2. مدير المنصة (Super Admin) ====================
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'يرجى إدخال البريد الإلكتروني وكلمة المرور' });
    }

    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin) {
      return res.status(400).json({ error: 'بيانات دخول الأدمن غير صحيحة' });
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'بيانات دخول الأدمن غير صحيحة' });
    }

    const token = jwt.sign(
      { id: admin.id, name: admin.name, email: admin.email, role: 'SUPER_ADMIN' },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.json({
      message: 'تم تسجيل دخول مدير المنصة بنجاح 👑',
      token,
      user: { id: admin.id, name: admin.name, email: admin.email, role: 'SUPER_ADMIN' }
    });
  } catch (err) {
    console.error('Admin login error:', err);
    return res.status(500).json({ error: 'فشل تسجيل دخول الأدمن' });
  }
};

// ==================== 3. حساب الطالب ====================
exports.studentLogin = async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone) {
      return res.status(400).json({ error: 'يرجى إدخال رقم الهاتف المسجل' });
    }

    const student = await prisma.student.findFirst({
      where: {
        OR: [
          { phone },
          { studentPhone: phone },
          { parentPhone: phone }
        ]
      },
      include: {
        group: {
          include: {
            teacher: { select: { name: true, centerName: true } }
          }
        }
      }
    });

    if (!student) {
      return res.status(404).json({ error: 'لم يتم العثور على طالب مسجل بهذا الرقم. تأكد من إضافتك بواسطة المعلم أولاً.' });
    }

    if (password && student.passwordHash) {
      const isMatch = await bcrypt.compare(password, student.passwordHash);
      if (!isMatch) {
        return res.status(400).json({ error: 'كلمة المرور غير صحيحة' });
      }
    }

    const token = jwt.sign(
      { id: student.id, name: student.name, role: 'STUDENT', groupId: student.groupId },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.json({
      message: 'تم تسجيل دخول الطالب بنجاح! 🎓',
      token,
      user: {
        id: student.id,
        name: student.name,
        role: 'STUDENT',
        groupName: student.group.name,
        subject: student.group.subject,
        teacherName: student.group.teacher.name,
        centerName: student.group.teacher.centerName
      }
    });
  } catch (err) {
    console.error('Student login error:', err);
    return res.status(500).json({ error: 'فشل تسجيل دخول الطالب' });
  }
};

// ==================== 4. فحص الجلسة الحالية ====================
exports.getMe = async (req, res) => {
  try {
    const { id, role } = req.user;

    if (role === 'SUPER_ADMIN') {
      const admin = await prisma.admin.findUnique({ where: { id }, select: { id: true, name: true, email: true, role: true } });
      return res.json({ user: admin });
    }

    if (role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({
        where: { id },
        select: { id: true, name: true, phone: true, centerName: true, subscriptionStatus: true, role: true }
      });
      return res.json({ user: teacher });
    }

    if (role === 'STUDENT') {
      const student = await prisma.student.findUnique({
        where: { id },
        include: { group: { include: { teacher: { select: { name: true, centerName: true } } } } }
      });
      return res.json({
        user: {
          id: student.id,
          name: student.name,
          role: 'STUDENT',
          groupName: student.group.name,
          teacherName: student.group.teacher.name,
          centerName: student.group.teacher.centerName
        }
      });
    }

    return res.status(400).json({ error: 'نوع الحساب غير معروف' });
  } catch (err) {
    return res.status(500).json({ error: 'فشل التحقق من الجلسة' });
  }
};
