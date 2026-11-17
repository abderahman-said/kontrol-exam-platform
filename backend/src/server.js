const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const prisma = require('./prisma');

const authRoutes = require('./routes/authRoutes');
const groupRoutes = require('./routes/groupRoutes');
const examRoutes = require('./routes/examRoutes');
const adminRoutes = require('./routes/adminRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const studentRoutes = require('./routes/studentRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// خدمة ملفات الـ PDF والصور المرفوعة للامتحانات
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/students', studentRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Kontrol SaaS Engine', time: new Date().toISOString() });
});

// Seed data تلقائي لتجهيز بيئة الـ SaaS بالكامل (أدمن، مدرس، طالب، باقة اشتراك)
async function seedDemoData() {
  try {
    // 1. حساب مسؤول المنصة الرئيسي (Super Admin)
    const adminCount = await prisma.admin.count();
    if (adminCount === 0) {
      const adminPassHash = await bcrypt.hash('admin123', 10);
      await prisma.admin.create({
        data: {
          name: 'إدارة منصة كَنترول (Super Admin)',
          email: 'admin@kontrol.eg',
          passwordHash: adminPassHash,
          role: 'SUPER_ADMIN'
        }
      });
      console.log('👑 تم إنشاء حساب مسؤول المنصة (Super Admin):');
      console.log('   الإيميل: admin@kontrol.eg | كلمة السر: admin123');
    }

    // 2. حساب المعلم ونموذج الاشتراك (45 ج/طالب)
    const teacherCount = await prisma.teacher.count();
    if (teacherCount === 0) {
      console.log('🌱 جاري إضافة بيانات أولية لمنصة الـ SaaS...');
      const passwordHash = await bcrypt.hash('123456', 10);
      const studentPassHash = await bcrypt.hash('123456', 10);

      const oneMonthLater = new Date();
      oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

      const teacher = await prisma.teacher.create({
        data: {
          name: 'أ. أحمد مصطفى',
          phone: '01012345678',
          passwordHash,
          centerName: 'سنتر النور التعليمي',
          role: 'TEACHER',
          subscriptionStatus: 'ACTIVE',
          pricePerStudent: 45.0,
          studentLimit: 50,
          subscriptionExpiresAt: oneMonthLater,
          groups: {
            create: [
              {
                name: 'فيزياء 3 ثانوي - مجموعة السبت',
                subject: 'الفيزياء',
                students: {
                  create: [
                    { name: 'محمد علي حسن', phone: '01099887766', studentPhone: '01099887766', parentPhone: '01099887766', passwordHash: studentPassHash },
                    { name: 'عمر شريف إبراهيم', phone: '01122334455', studentPhone: '01122334455', parentPhone: '01122334455', passwordHash: studentPassHash },
                    { name: 'مريم عادل محمود', phone: '01233445566', studentPhone: '01233445566', parentPhone: '01233445566', passwordHash: studentPassHash },
                    { name: 'يوسف خالد زكي', phone: '01555667788', studentPhone: '01555667788', parentPhone: '01555667788', passwordHash: studentPassHash }
                  ]
                }
              }
            ]
          },
          payments: {
            create: [
              {
                amount: 180.0, // 4 طلاب × 45 ج = 180 ج
                studentCount: 4,
                periodMonths: 1,
                paymentMethod: 'INSTAPAY',
                transactionRef: 'INSTA-8947238',
                status: 'APPROVED',
                approvedAt: new Date()
              }
            ]
          }
        }
      });
      console.log('✅ تم إنشاء حساب المدرس (أ. أحمد مصطفى) مع باقة اشتراك سارية:');
      console.log('   الموبايل: 01012345678 | كلمة المرور: 123456');
      console.log('🎓 حساب الطالب التجريبي (محمد علي حسن):');
      console.log('   الموبايل: 01099887766 | كلمة المرور: 123456');
    }
  } catch (err) {
    console.error('Seed demo data error:', err);
  }
}

app.listen(PORT, async () => {
  console.log(`🚀 خادم منصة الـ SaaS يعمل الآن على: http://localhost:${PORT}`);
  await seedDemoData();
});
