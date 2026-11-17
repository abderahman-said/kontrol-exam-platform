const prisma = require('../prisma');

// إحصائيات المنصة الكبرى لصاحب المشروع (حساب دقيق 100% لنسبة الـ 10% لكل طالب)
exports.getPlatformStats = async (req, res) => {
  try {
    const [
      teacherCount,
      studentCount,
      examCount,
      attemptCount,
      approvedPayments,
      pendingPayments,
      teachers
    ] = await Promise.all([
      prisma.teacher.count(),
      prisma.student.count(),
      prisma.exam.count(),
      prisma.examAttempt.count(),
      prisma.subscriptionPayment.findMany({
        where: { status: 'APPROVED' },
        select: { amount: true }
      }),
      prisma.subscriptionPayment.findMany({
        where: { status: 'PENDING' },
        select: { amount: true }
      }),
      prisma.teacher.findMany({
        include: {
          groups: {
            include: {
              _count: { select: { students: true } }
            }
          }
        }
      })
    ]);

    // 1. إجمالي العمولات المحصلة كاش لصاحب المنصة
    const totalCollectedCommission = approvedPayments.reduce((sum, p) => sum + p.amount, 0);

    // 2. العمولات المعلقة بانتظار المراجعة والاعتماد
    const pendingCommission = pendingPayments.reduce((sum, p) => sum + p.amount, 0);

    // 3. حساب حجم التداول المالي الإجمالي (GMV) وعمولة المنصة الشهرية المتوقعة (10%) ديناميكياً من كل مدرس
    let grossMarketVolume = 0;
    let expectedMonthlyCommission = 0;

    teachers.forEach(t => {
      const teacherStudentCount = t.groups.reduce((acc, g) => acc + (g._count.students || 0), 0);
      const studentFee = t.pricePerStudent || 50.0;
      const teacherGMV = teacherStudentCount * studentFee; // 100%
      const teacherCommission = teacherGMV * 0.10; // 10% نصيب المنصة

      grossMarketVolume += teacherGMV;
      expectedMonthlyCommission += teacherCommission;
    });

    return res.json({
      stats: {
        totalTeachers: teacherCount,
        totalStudents: studentCount,
        totalExams: examCount,
        totalAttempts: attemptCount,
        grossMarketVolumeEGP: grossMarketVolume,
        totalCollectedCommissionEGP: totalCollectedCommission,
        pendingCommissionEGP: pendingCommission,
        expectedMonthlyCommissionEGP: expectedMonthlyCommission,
        commissionRate: 10 // 10%
      }
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    return res.status(500).json({ error: 'فشل جلب إحصائيات الأدمن' });
  }
};

// كشف المعلمين والعمولات المستحقة (10%)
exports.getAllTeachers = async (req, res) => {
  try {
    const teachers = await prisma.teacher.findMany({
      include: {
        groups: {
          include: {
            _count: { select: { students: true } }
          }
        },
        _count: {
          select: { exams: true }
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formatted = teachers.map(t => {
      const studentCount = t.groups.reduce((acc, g) => acc + (g._count.students || 0), 0);
      const studentFee = t.pricePerStudent || 50;
      const totalCollectedFromStudents = studentCount * studentFee; // 100%
      const teacherShare = totalCollectedFromStudents * 0.90; // 90% للمعلم
      const platformDueCommission = totalCollectedFromStudents * 0.10; // 10% للمنصة (5 ج/طالب)

      return {
        id: t.id,
        name: t.name,
        phone: t.phone,
        centerName: t.centerName,
        subscriptionStatus: t.subscriptionStatus,
        subscriptionExpiresAt: t.subscriptionExpiresAt,
        studentCount,
        examCount: t._count.exams,
        studentFee,
        totalCollectedFromStudents,
        teacherShare,
        platformDueCommission,
        lastPayment: t.payments[0] || null
      };
    });

    return res.json({ teachers: formatted });
  } catch (err) {
    return res.status(500).json({ error: 'فشل جلب قائمة المعلمين' });
  }
};

// قائمة التحويلات الواردة عبر انستاباي وفودافون كاش
exports.getSubscriptionPayments = async (req, res) => {
  try {
    const payments = await prisma.subscriptionPayment.findMany({
      include: {
        teacher: {
          select: { name: true, phone: true, centerName: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.json({ payments });
  } catch (err) {
    return res.status(500).json({ error: 'فشل جلب المدفوعات' });
  }
};

// اعتماد تحويل بنكي / محفظة لمعلم
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const payment = await prisma.subscriptionPayment.findUnique({ where: { id } });
    if (!payment) {
      return res.status(404).json({ error: 'طلب التحويل غير موجود' });
    }

    const updatedPayment = await prisma.subscriptionPayment.update({
      where: { id },
      data: {
        status,
        approvedAt: status === 'APPROVED' ? new Date() : null
      }
    });

    if (status === 'APPROVED') {
      const now = new Date();
      const newExpiry = new Date(now.setMonth(now.getMonth() + (payment.periodMonths || 1)));
      await prisma.teacher.update({
        where: { id: payment.teacherId },
        data: {
          subscriptionStatus: 'ACTIVE',
          subscriptionExpiresAt: newExpiry
        }
      });
    }

    return res.json({ message: 'تم تحديث حالة العمولة وتمديد حساب المعلم بنجاح', payment: updatedPayment });
  } catch (err) {
    return res.status(500).json({ error: 'فشل تحديث حالة التحويل' });
  }
};
