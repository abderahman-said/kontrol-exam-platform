const prisma = require('../prisma');
const ExcelJS = require('exceljs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middlewares/auth');

// دالة ذكية لتحليل مفتاح الحل السريع كما في صور ClassA
// تدعم كتابة: "ب أ ب ج د" أو "1-ب 2-أ 3-ج" أو "A B C D"
function parseQuickKey(rawKey) {
  if (!rawKey) return [];
  
  const str = String(rawKey);
  const result = [];

  for (let ch of str) {
    if (/[أإآاAa]/.test(ch)) result.push('أ');
    else if (/[بBb]/.test(ch)) result.push('ب');
    else if (/[جCc]/.test(ch)) result.push('ج');
    else if (/[دDd]/.test(ch)) result.push('د');
  }

  return result;
}

// دالة توليد كود عشوائي للطلاب
function generateShortCode(length = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// إنشاء امتحان جديد
exports.createExam = async (req, res) => {
  try {
    const {
      title,
      type = 'ANSWER_SHEET',
      groupIds = [],
      durationMins = 30,
      showAnswers = 'AFTER_DEADLINE',
      quickKey = '',
      questionsData = [], // في حالة الأسئلة المكتوبة يدوياً
      startsAt,
      endsAt
    } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'عنوان الامتحان مطلوب' });
    }

    let pdfUrl = null;
    if (req.file) {
      pdfUrl = `/uploads/${req.file.filename}`;
    }

    // تحليل questionsData في حال تم إرسالها كسلسلة نصية JSON من FormData
    let parsedQuestions = [];
    if (typeof questionsData === 'string' && questionsData.trim().length > 0) {
      try {
        parsedQuestions = JSON.parse(questionsData);
      } catch (e) {
        console.error('Failed to parse questionsData JSON:', e);
      }
    } else if (Array.isArray(questionsData)) {
      parsedQuestions = questionsData;
    }

    // بناء قائمة الأسئلة
    let questionsToCreate = [];

    // إذا كانت هناك أسئلة مكتوبة يدوياً (سواء اختيار من متعدد أو مقالي)
    if (parsedQuestions.length > 0) {
      questionsToCreate = parsedQuestions.map((q, index) => {
        let textPayload = q.text || `السؤال ${index + 1}`;
        // دمج الخيارات داخل حقل text بتنسيق JSON إذا كانت متوفرة
        if (q.options && typeof q.options === 'object') {
          textPayload = JSON.stringify({
            question: q.text || `السؤال ${index + 1}`,
            options: q.options
          });
        }

        return {
          questionIndex: index + 1,
          text: textPayload,
          correctAnswer: q.correctAnswer || 'أ',
          degree: parseFloat(q.degree) || 1.0,
          explanation: q.explanation || ''
        };
      });
    } else if (quickKey) {
      const keys = parseQuickKey(quickKey);
      if (keys.length > 0) {
        questionsToCreate = keys.map((key, index) => ({
          questionIndex: index + 1,
          correctAnswer: key,
          degree: 1.0,
          text: `السؤال ${index + 1}`
        }));
      }
    }

    if (questionsToCreate.length === 0) {
      const defaultKeys = ['أ', 'ب', 'ج', 'د', 'أ'];
      questionsToCreate = defaultKeys.map((key, index) => ({
        questionIndex: index + 1,
        correctAnswer: key,
        degree: 1.0,
        text: `السؤال ${index + 1}`
      }));
    }

    const totalDegree = questionsToCreate.reduce((sum, q) => sum + (q.degree || 1), 0);

    // إنشاء الامتحان في المعاملة (Transaction)
    const exam = await prisma.exam.create({
      data: {
        title,
        type,
        pdfUrl,
        durationMins: parseInt(durationMins) || 30,
        showAnswers,
        totalDegree,
        startsAt: startsAt ? new Date(startsAt) : null,
        endsAt: endsAt ? new Date(endsAt) : null,
        teacherId: req.user.id,
        questions: {
          create: questionsToCreate
        }
      },
      include: {
        questions: true
      }
    });

    // ربط المجموعات المختارة وتوليد أكواد للطلاب
    let groupIdsArray = Array.isArray(groupIds) ? groupIds : (groupIds ? [groupIds] : []);
    if (groupIdsArray.length === 0) {
      const allTeacherGroups = await prisma.group.findMany({ where: { teacherId: req.user.id } });
      groupIdsArray = allTeacherGroups.map(g => g.id);
    }
    for (const gid of groupIdsArray) {
      await prisma.examGroup.create({
        data: { examId: exam.id, groupId: gid }
      });

      // جلب طلاب المجموعة لتوليد أكواد لهم
      const students = await prisma.student.findMany({ where: { groupId: gid } });
      for (const st of students) {
        let uniqueCode = generateShortCode();
        await prisma.accessCode.create({
          data: {
            examId: exam.id,
            code: uniqueCode,
            studentName: st.name
          }
        });
      }
    }

    // كود عام إضافي لمشاركة رابط مباشر للمجموعة
    const generalCode = generateShortCode(6);
    await prisma.accessCode.create({
      data: {
        examId: exam.id,
        code: generalCode,
        studentName: 'عام'
      }
    });

    return res.status(201).json({
      message: 'تم إنشاء الامتحان ونشر المفتاح بنجاح',
      exam: {
        ...exam,
        generalCode
      }
    });
  } catch (err) {
    console.error('Create exam error:', err);
    return res.status(500).json({ error: 'فشل إنشاء الامتحان، تأكد من صحة البيانات والملف' });
  }
};

// قائمة امتحانات المدرس
exports.getTeacherExams = async (req, res) => {
  try {
    const exams = await prisma.exam.findMany({
      where: { teacherId: req.user.id },
      include: {
        groups: {
          include: { group: true }
        },
        _count: {
          select: { questions: true, attempts: true, accessCodes: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.json({ exams });
  } catch (err) {
    return res.status(500).json({ error: 'فشل جلب قائمة الامتحانات' });
  }
};

// تفاصيل امتحان للمدرس مع الطلاب والنتائج
exports.getExamDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const exam = await prisma.exam.findFirst({
      where: { id, teacherId: req.user.id },
      include: {
        questions: { orderBy: { questionIndex: 'asc' } },
        groups: { include: { group: true } },
        accessCodes: true,
        attempts: {
          orderBy: { score: 'desc' },
          include: {
            answers: {
              include: { question: true }
            }
          }
        }
      }
    });

    if (!exam) {
      return res.status(404).json({ error: 'الامتحان غير موجود' });
    }

    // حساب إحصائيات ذكية
    const attempts = exam.attempts || [];
    const totalAttempts = attempts.length;
    let avgScore = 0;
    let maxScore = 0;
    let minScore = 0;
    let passCount = 0;

    if (totalAttempts > 0) {
      const scores = attempts.map(a => a.score);
      avgScore = (scores.reduce((a, b) => a + b, 0) / totalAttempts).toFixed(1);
      maxScore = Math.max(...scores);
      minScore = Math.min(...scores);
      passCount = attempts.filter(a => a.score >= (exam.totalDegree / 2)).length;
    }

    // تحليل الأسئلة الأكثر خطأً (أهم ميزة للمدرس لمعرفة ما يحتاج إعادة شرح)
    const questionStats = exam.questions.map(q => {
      let totalAnswers = 0;
      let wrongAnswers = 0;
      attempts.forEach(att => {
        const ans = att.answers.find(a => a.questionId === q.id);
        if (ans) {
          totalAnswers++;
          if (!ans.isCorrect) wrongAnswers++;
        }
      });
      return {
        id: q.id,
        index: q.questionIndex,
        correctAnswer: q.correctAnswer,
        degree: q.degree,
        wrongCount: wrongAnswers,
        wrongRate: totalAnswers > 0 ? Math.round((wrongAnswers / totalAnswers) * 100) : 0
      };
    }).sort((a, b) => b.wrongRate - a.wrongRate);

    // توليد النماذج الأربعة (أ، ب، ج، د) ومفاتيح حلها تلقائياً لمنع الغش في السناتر
    const baseQuestions = exam.questions || [];
    const n = baseQuestions.length;
    const models = {
      modelA: {
        label: 'نموذج (أ)',
        code: 'A',
        key: baseQuestions.map(q => q.correctAnswer).join(' '),
        items: baseQuestions.map((q, i) => ({ originalIndex: q.questionIndex, modelIndex: i + 1, answer: q.correctAnswer }))
      },
      modelB: {
        label: 'نموذج (ب)',
        code: 'B',
        items: baseQuestions.map((q, i) => {
          const newIdx = n > 0 ? (i + Math.floor(n / 2)) % n : 0;
          return { originalIndex: baseQuestions[newIdx].questionIndex, modelIndex: i + 1, answer: baseQuestions[newIdx].correctAnswer };
        })
      },
      modelC: {
        label: 'نموذج (ج)',
        code: 'C',
        items: baseQuestions.map((q, i) => {
          const newIdx = i % 2 === 0 ? Math.min(i + 1, n - 1) : i - 1;
          const target = baseQuestions[newIdx] || q;
          return { originalIndex: target.questionIndex, modelIndex: i + 1, answer: target.correctAnswer };
        })
      },
      modelD: {
        label: 'نموذج (د)',
        code: 'D',
        items: [...baseQuestions].reverse().map((q, i) => ({
          originalIndex: q.questionIndex,
          modelIndex: i + 1,
          answer: q.correctAnswer
        }))
      }
    };
    models.modelB.key = models.modelB.items.map(it => it.answer).join(' ');
    models.modelC.key = models.modelC.items.map(it => it.answer).join(' ');
    models.modelD.key = models.modelD.items.map(it => it.answer).join(' ');

    return res.json({
      exam,
      models,
      analytics: {
        totalAttempts,
        avgScore,
        maxScore,
        minScore,
        passRate: totalAttempts > 0 ? Math.round((passCount / totalAttempts) * 100) : 0,
        hardestQuestions: questionStats.slice(0, 5) // أهم 5 أسئلة أخطأ فيها الطلاب
      }
    });
  } catch (err) {
    console.error('Exam details error:', err);
    return res.status(500).json({ error: 'فشل جلب تفاصيل الامتحان' });
  }
};

// دخول الطالب للامتحان عبر الكود
exports.studentJoinExam = async (req, res) => {
  try {
    const { code, studentName, parentPhone } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'يرجى إدخال كود الامتحان' });
    }

    const cleanCode = code.trim().toUpperCase();
    const accessCode = await prisma.accessCode.findUnique({
      where: { code: cleanCode },
      include: {
        exam: {
          include: {
            questions: {
              select: {
                id: true,
                questionIndex: true,
                degree: true,
                text: true
                // لا نرسل correctAnswer للطالب لحماية الامتحان من فحص الشبكة / DevTools!
              },
              orderBy: { questionIndex: 'asc' }
            }
          }
        }
      }
    });

    if (!accessCode) {
      return res.status(404).json({ error: 'كود الامتحان غير صالح، تأكد من كتابة الكود بشكل صحيح' });
    }

    const exam = accessCode.exam;

    // فحص موعد الامتحان
    const now = new Date();
    if (exam.startsAt && now < new Date(exam.startsAt)) {
      return res.status(400).json({ error: `الامتحان لم يبدأ بعد، موعد البدء: ${new Date(exam.startsAt).toLocaleString('ar-EG')}` });
    }
    if (exam.endsAt && now > new Date(exam.endsAt)) {
      return res.status(400).json({ error: 'عفواً، انتهى الموعد المحدد لاستقبال إجابات هذا الامتحان' });
    }

    // استخراج معرف الطالب المسجل (سواء من التوكن أو البودي أو المطابقة برقم الهاتف)
    let studentId = req.body.studentId || null;
    const authHeader = req.headers.authorization;
    if (!studentId && authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
        if (decoded && decoded.role === 'STUDENT') {
          studentId = decoded.id;
        }
      } catch (e) {}
    }

    if (!studentId && (studentName || parentPhone)) {
      const match = await prisma.student.findFirst({
        where: {
          OR: [
            ...(studentName ? [{ name: studentName.trim() }] : []),
            ...(parentPhone ? [{ parentPhone: parentPhone.trim() }, { studentPhone: parentPhone.trim() }] : [])
          ]
        }
      });
      if (match) {
        studentId = match.id;
      }
    }

    let finalStudentName = studentName;
    let finalParentPhone = parentPhone || '';

    if (studentId) {
      const studentRecord = await prisma.student.findUnique({ where: { id: studentId } });
      if (studentRecord) {
        if (!finalStudentName || finalStudentName === 'طالب') {
          finalStudentName = studentRecord.name;
        }
        if (!finalParentPhone) {
          finalParentPhone = studentRecord.parentPhone;
        }
      }
    }

    if (!finalStudentName) {
      finalStudentName = accessCode.studentName || 'طالب';
    }

    // 🔒 التحقق الصارم لمنع مشاركة الكود: هل الكود مستخدم بالفعل من قِبل طالب آخر؟
    if (accessCode.isUsed && accessCode.studentName && accessCode.studentName !== 'عام') {
      if (finalStudentName && accessCode.studentName.trim() !== finalStudentName.trim()) {
        return res.status(403).json({
          error: `عفواً، هذا الكود تم تفعيله واستخدامه مسبقاً بواسطة الطالب (${accessCode.studentName})! لا يمكن لطالبين استخدام نفس الكود.`
        });
      }
    }

    // إنشاء محاولة جديدة للطالب وربطها بمعرف الطالب
    const attempt = await prisma.examAttempt.create({
      data: {
        examId: exam.id,
        studentId: studentId || null,
        studentName: finalStudentName,
        parentPhone: finalParentPhone,
        totalDegree: exam.totalDegree,
        startedAt: new Date()
      }
    });

    // حرق الكود وتسجيل استخدامه وتثبيته باسم الطالب لمنع تكراره نهائياً
    await prisma.accessCode.update({
      where: { id: accessCode.id },
      data: {
        isUsed: true,
        usedAt: accessCode.usedAt || new Date(),
        studentName: finalStudentName
      }
    });

    return res.json({
      attemptId: attempt.id,
      exam: {
        id: exam.id,
        title: exam.title,
        type: exam.type,
        pdfUrl: exam.pdfUrl,
        durationMins: exam.durationMins,
        totalDegree: exam.totalDegree,
        questions: exam.questions
      },
      studentName: finalStudentName
    });
  } catch (err) {
    console.error('Join exam error:', err);
    return res.status(500).json({ error: 'فشل الدخول للامتحان' });
  }
};

// تسجيل محاولة غش (خروج من التاب أو تصغير الشاشة)
exports.logCheatEvent = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { reason } = req.body;

    const attempt = await prisma.examAttempt.update({
      where: { id: attemptId },
      data: {
        tabSwitchCount: { increment: 1 }
      }
    });

    return res.json({ success: true, count: attempt.tabSwitchCount });
  } catch (err) {
    return res.status(500).json({ error: 'فشل تسجيل الحدث' });
  }
};

// تسليم الامتحان وتصحيحه تلقائياً فوراً
exports.submitExam = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { answers = [] } = req.body; // [{ questionId, answerGiven }]

    const attempt = await prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: {
        exam: {
          include: {
            questions: true
          }
        }
      }
    });

    if (!attempt) {
      return res.status(404).json({ error: 'المحاولة غير موجودة' });
    }

    if (attempt.isCompleted) {
      return res.status(400).json({ error: 'تم تسليم هذا الامتحان مسبقاً' });
    }

    const questionsMap = new Map();
    attempt.exam.questions.forEach(q => questionsMap.set(q.id, q));

    let finalScore = 0;
    const answersToCreate = [];

    for (const ans of answers) {
      const q = questionsMap.get(ans.questionId);
      if (q) {
        // فحص مطابقة الإجابة
        const isCorrect = (q.correctAnswer.trim().toLowerCase() === (ans.answerGiven || '').trim().toLowerCase());
        const earned = isCorrect ? q.degree : 0;
        finalScore += earned;

        answersToCreate.push({
          attemptId: attempt.id,
          questionId: q.id,
          answerGiven: ans.answerGiven || '',
          isCorrect,
          degreeEarned: earned
        });
      }
    }

    // حفظ كل الإجابات وتحديث نتيجة المحاولة
    await prisma.$transaction([
      prisma.studentAnswer.createMany({
        data: answersToCreate
      }),
      prisma.examAttempt.update({
        where: { id: attemptId },
        data: {
          score: finalScore,
          isCompleted: true,
          submittedAt: new Date()
        }
      })
    ]);

    return res.json({
      message: 'تم تسليم الامتحان وتصحيحه بنجاح! 🎯',
      score: finalScore,
      totalDegree: attempt.exam.totalDegree,
      showAnswers: attempt.exam.showAnswers,
      tabSwitchCount: attempt.tabSwitchCount,
      attemptId: attempt.id,
      examId: attempt.exam.id,
      examTitle: attempt.exam.title
    });
  } catch (err) {
    console.error('Submit exam error:', err);
    return res.status(500).json({ error: 'حدث خطأ أثناء تسليم الامتحان' });
  }
};

// تصدير النتائج إلى Excel شيك للمدرس
exports.exportToExcel = async (req, res) => {
  try {
    const { id } = req.params;
    const exam = await prisma.exam.findFirst({
      where: { id, teacherId: req.user.id },
      include: {
        attempts: {
          orderBy: { score: 'desc' }
        }
      }
    });

    if (!exam) {
      return res.status(404).json({ error: 'الامتحان غير موجود' });
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('كشف درجات الامتحان', {
      views: [{ rightToLeft: true }]
    });

    // العناوين
    sheet.columns = [
      { header: 'م', key: 'index', width: 6 },
      { header: 'اسم الطالب', key: 'name', width: 25 },
      { header: 'رقم ولي الأمر', key: 'parentPhone', width: 16 },
      { header: 'الدرجة', key: 'score', width: 12 },
      { header: 'الدرجة الكلية', key: 'total', width: 12 },
      { header: 'النسبة المئوية', key: 'percentage', width: 14 },
      { header: 'مرات مغادرة الامتحان (شبهة غش)', key: 'cheat', width: 28 },
      { header: 'تاريخ ووقت التسليم', key: 'submittedAt', width: 22 }
    ];

    // تنسيق صف العناوين
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF10B981' } // Emerald green
    };

    exam.attempts.forEach((att, idx) => {
      const percentage = exam.totalDegree > 0 ? Math.round((att.score / exam.totalDegree) * 100) : 0;
      sheet.addRow({
        index: idx + 1,
        name: att.studentName,
        parentPhone: att.parentPhone || '-',
        score: att.score,
        total: exam.totalDegree,
        percentage: `${percentage}%`,
        cheat: att.tabSwitchCount > 0 ? `${att.tabSwitchCount} مرة` : 'التزام تام',
        submittedAt: att.submittedAt ? new Date(att.submittedAt).toLocaleString('ar-EG') : '-'
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=exam-${exam.id}-results.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Export Excel error:', err);
    return res.status(500).json({ error: 'فشل تصدير ملف الإكسيل' });
  }
};

// تقرير ولي الأمر المباشر (رابط آمن بدون تسجيل دخول)
exports.getParentReport = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const attempt = await prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: {
        exam: {
          include: {
            teacher: {
              select: { name: true, centerName: true, phone: true }
            }
          }
        },
        answers: {
          include: {
            question: {
              select: {
                questionIndex: true,
                correctAnswer: true,
                degree: true,
                explanation: true,
                text: true
              }
            }
          },
          orderBy: { question: { questionIndex: 'asc' } }
        }
      }
    });

    if (!attempt || !attempt.isCompleted) {
      return res.status(404).json({ error: 'تقرير الامتحان غير متاح أو لم يتم تسليمه بعد' });
    }

    const percentage = attempt.totalDegree > 0 ? Math.round((attempt.score / attempt.totalDegree) * 100) : 0;
    const isHonored = percentage >= 85;

    return res.json({
      report: {
        attemptId: attempt.id,
        studentName: attempt.studentName,
        examTitle: attempt.exam.title,
        teacherName: attempt.exam.teacher.name,
        centerName: attempt.exam.teacher.centerName || 'سنتر تعليمي',
        score: attempt.score,
        totalDegree: attempt.totalDegree,
        percentage,
        tabSwitchCount: attempt.tabSwitchCount,
        submittedAt: attempt.submittedAt,
        isHonored,
        answers: attempt.answers.map(ans => ({
          questionIndex: ans.question?.questionIndex || 1,
          studentAnswer: ans.answerGiven,
          correctAnswer: ans.question?.correctAnswer,
          isCorrect: ans.isCorrect,
          degreeEarned: ans.degreeEarned,
          explanation: ans.question?.explanation || ''
        }))
      }
    });
  } catch (err) {
    console.error('Parent report error:', err);
    return res.status(500).json({ error: 'فشل جلب تقرير ولي الأمر' });
  }
};

// رصد ورقة بابل شيت ورقية تم تصحيحها بالكاميرا أو المسح الضوئي (OMR Scanner API)
exports.omrScanSubmit = async (req, res) => {
  try {
    const { id } = req.params;
    const { studentName, parentPhone, answers = [], modelCode = 'A' } = req.body;

    const exam = await prisma.exam.findFirst({
      where: { id, teacherId: req.user.id },
      include: {
        questions: { orderBy: { questionIndex: 'asc' } }
      }
    });

    if (!exam) {
      return res.status(404).json({ error: 'الامتحان غير موجود' });
    }

    const name = (studentName && studentName.trim()) ? studentName.trim() : `طالب بابل شيت #${Math.floor(1000 + Math.random() * 9000)}`;
    const phone = (parentPhone && parentPhone.trim()) ? parentPhone.trim() : '';

    const questions = exam.questions;
    let score = 0;
    const answersToCreate = [];

    questions.forEach((q, idx) => {
      const studentAns = (answers[idx] || '').trim().toLowerCase();
      const isCorrect = (studentAns === (q.correctAnswer || '').trim().toLowerCase());
      const earned = isCorrect ? q.degree : 0;
      score += earned;

      answersToCreate.push({
        questionId: q.id,
        answerGiven: studentAns,
        isCorrect,
        degreeEarned: earned
      });
    });

    const attempt = await prisma.examAttempt.create({
      data: {
        examId: exam.id,
        studentName: name,
        parentPhone: phone,
        score,
        totalDegree: exam.totalDegree,
        isCompleted: true,
        submittedAt: new Date(),
        tabSwitchCount: 0 // ورقي
      }
    });

    if (answersToCreate.length > 0) {
      await prisma.studentAnswer.createMany({
        data: answersToCreate.map(a => ({ ...a, attemptId: attempt.id }))
      });
    }

    const percentage = exam.totalDegree > 0 ? Math.round((score / exam.totalDegree) * 100) : 0;

    return res.status(201).json({
      message: `تم رصد ورقة (${name}) بنجاح! الدرجة: ${score} من ${exam.totalDegree} (${percentage}%)`,
      attempt: {
        id: attempt.id,
        studentName: name,
        parentPhone: phone,
        score,
        totalDegree: exam.totalDegree,
        percentage
      }
    });
  } catch (err) {
    console.error('OMR scan submit error:', err);
    return res.status(500).json({ error: 'فشل رصد ورقة البابل شيت' });
  }
};

// ==========================================================
// تصحيح الأسئلة المقالية بالذكاء الاصطناعي (AI Essay Grader & OCR)
// ==========================================================
const fs = require('fs');
const { gradeEssayWithVision } = require('../services/aiTutorService');

exports.aiGradeEssay = async (req, res) => {
  try {
    const {
      questionText,
      modelAnswer,
      maxDegree = 5,
      subject = 'عام',
      studentName = ''
    } = req.body;

    let imageBase64 = req.body.imageBase64 || null;
    let imageMimeType = req.body.imageMimeType || 'image/jpeg';

    if (req.file) {
      const fileBuffer = fs.readFileSync(req.file.path);
      imageBase64 = fileBuffer.toString('base64');
      imageMimeType = req.file.mimetype || 'image/jpeg';
    }

    if (!imageBase64) {
      return res.status(400).json({ error: 'يرجى التقاط صورة إجابة الطالب المقالية أو رفعها أولاً' });
    }

    // تنظيف بادئة data:image/...;base64, إن وُجدت
    if (imageBase64.includes('base64,')) {
      const parts = imageBase64.split('base64,');
      imageBase64 = parts[1];
      const match = parts[0].match(/data:(.*?);/);
      if (match) imageMimeType = match[1];
    }

    const grading = await gradeEssayWithVision({
      questionText,
      modelAnswer,
      maxDegree,
      imageBase64,
      imageMimeType,
      subject,
      studentName
    });

    return res.json({
      success: true,
      message: 'تم تصحيح الإجابة المقالية وقراءة خط يد الطالب بنجاح! 🎓',
      grading
    });
  } catch (err) {
    console.error('AI Essay Grading Error:', err);
    return res.status(500).json({ error: 'تعذر تصحيح الإجابة المقالية حالياً، يرجى المحاولة مرة أخرى.' });
  }
};

