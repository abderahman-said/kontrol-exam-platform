const prisma = require('../prisma');

// جلب تفاصيل عمولة المنصة (10% عن كل طالب) واشتراك المعلم
exports.getTeacherSubscription = async (req, res) => {
  try {
    const teacher = await prisma.teacher.findUnique({
      where: { id: req.user.id },
      include: {
        groups: {
          include: {
            _count: { select: { students: true } }
          }
        },
        payments: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!teacher) {
      return res.status(404).json({ error: 'المعلم غير موجود' });
    }

    // إجمالي الطلاب المسجلين
    const activeStudentsCount = teacher.groups.reduce((acc, g) => acc + (g._count.students || 0), 0);
    
    // نموذج العمل: اشتراك الطالب 50 ج.م شهرياً، والمنصة تأخذ نسبة 10% فقط (5 ج.م عن كل طالب)
    const studentSubscriptionFee = teacher.pricePerStudent || 50.0; // 50 ج.م لكل طالب
    const commissionRate = 0.10; // 10% نسبة المنصة
    const platformCommissionPerStudent = studentSubscriptionFee * commissionRate; // 5 ج.م
    
    // إجمالي دخل المعلم من الطلاب (100%)
    const totalStudentRevenue = activeStudentsCount * studentSubscriptionFee;
    
    // نصيب المعلم الصافي (90%)
    const teacherNetRevenue = totalStudentRevenue * (1 - commissionRate);
    
    // مستحقات المنصة الواجب سدادها (10%)
    const platformDueEGP = activeStudentsCount * platformCommissionPerStudent;

    const studentLimit = teacher.studentLimit || 30;
    const availableStudentQuota = Math.max(0, studentLimit - activeStudentsCount);

    return res.json({
      subscription: {
        status: teacher.subscriptionStatus, // "TRIAL", "ACTIVE", "EXPIRED"
        expiresAt: teacher.subscriptionExpiresAt,
        activeStudentsCount,
        studentLimit,
        availableStudentQuota,
        studentSubscriptionFee,
        commissionRate: 10, // 10%
        platformCommissionPerStudent,
        totalStudentRevenue,
        teacherNetRevenue,
        platformDueEGP,
        // قنوات السداد المباشرة في مصر بدون بوابات دفع خارجية
        paymentOptions: [
          { 
            method: 'INSTAPAY', 
            label: 'انستاباي (InstaPay)', 
            account: 'kontrol@instapay', 
            instructions: 'تحويل فوري بدون أي رسوم إضافية لحساب انستاباي الخاص بالمنصة' 
          },
          { 
            method: 'VODAFONE_CASH', 
            label: 'فودافون كاش (Vodafone Cash)', 
            account: '01099887766', 
            instructions: 'تحويل كاش من أي محفظة إلكترونية بمصر (فودافون/أورنج/اتصالات/وي)' 
          }
        ],
        invoices: teacher.payments
      }
    });
  } catch (err) {
    console.error('Subscription error:', err);
    return res.status(500).json({ error: 'فشل جلب تفاصيل الاشتراك' });
  }
};

// تقديم إشعار تحويل عمولة المنصة لشحن رصيد طلاب إضافي عبر انستاباي أو فودافون كاش
exports.submitPayment = async (req, res) => {
  try {
    const { paymentMethod = 'INSTAPAY', transactionRef, studentCount = 30 } = req.body;

    if (!transactionRef) {
      return res.status(400).json({ error: 'يرجى إدخال رقم المعاملة أو رقم الموبايل المحول منه' });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { id: req.user.id },
      include: {
        groups: {
          include: { _count: { select: { students: true } } }
        }
      }
    });

    const numStudents = Math.max(1, parseInt(studentCount) || 30);
    const studentSubscriptionFee = teacher.pricePerStudent || 50.0;
    const commissionRate = 0.10; // 10% نسبة المنصة
    const commissionPerStudent = studentSubscriptionFee * commissionRate;
    
    // قيمة عمولة المنصة المحولة لشحن هؤلاء الطلاب
    const amount = numStudents * commissionPerStudent;

    const payment = await prisma.subscriptionPayment.create({
      data: {
        teacherId: teacher.id,
        amount,
        studentCount: numStudents,
        periodMonths: 1,
        paymentMethod: paymentMethod === 'VODAFONE_CASH' ? 'VODAFONE_CASH' : 'INSTAPAY',
        transactionRef: transactionRef.trim(),
        status: 'APPROVED', // تفعيل تلقائي
        approvedAt: new Date()
      }
    });

    // زيادة رصيد سعة الطلاب المشحونة للمعلم
    const currentLimit = teacher.studentLimit || 30;
    const newLimit = currentLimit + numStudents;

    // تمديد تاريخ الاشتراك
    const currentExpiry = teacher.subscriptionExpiresAt ? new Date(teacher.subscriptionExpiresAt) : new Date();
    const newExpiry = new Date(currentExpiry.setMonth(currentExpiry.getMonth() + 1));

    await prisma.teacher.update({
      where: { id: teacher.id },
      data: {
        studentLimit: newLimit,
        subscriptionStatus: 'ACTIVE',
        subscriptionExpiresAt: newExpiry
      }
    });

    return res.status(201).json({
      message: `تم شحن رصيد ${numStudents} طالب بنجاح بإجمالي عمولة (${amount} ج.م)! سعتك الإجمالية الآن ${newLimit} طالب 🚀`,
      payment,
      studentLimit: newLimit
    });
  } catch (err) {
    console.error('Submit payment error:', err);
    return res.status(500).json({ error: 'فشل تسجيل عملية الدفع' });
  }
};

// تحديث سعر اشتراك الطالب المحدد من قِبل المعلم (بحد أقصى 200 جنيه شهرياً)
exports.updateTeacherPricing = async (req, res) => {
  try {
    const { pricePerStudent } = req.body;
    const fee = parseFloat(pricePerStudent);
    if (!fee || fee < 10 || fee > 200) {
      return res.status(400).json({ error: 'يرجى إدخال اشتراك شهري للطالب بين 10 و 200 جنيه كحد أقصى' });
    }

    const teacher = await prisma.teacher.update({
      where: { id: req.user.id },
      data: { pricePerStudent: fee }
    });

    const commission = (fee * 0.10).toFixed(1);

    return res.json({
      message: `تم تحديث سعر اشتراك الطالب إلى ${fee} ج.م (عمولة المنصة 10% = ${commission} ج.م)`,
      pricePerStudent: teacher.pricePerStudent,
      platformCommissionPerStudent: fee * 0.10
    });
  } catch (err) {
    console.error('Update pricing error:', err);
    return res.status(500).json({ error: 'فشل تحديث سعر الاشتراك' });
  }
};
