const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma');
const { JWT_SECRET } = require('../middlewares/auth');
const { 
  generateAIExplanation, 
  gradeEssayWithVision, 
  chatWithAITutor, 
  updateApiKeyConfig, 
  getAIConfigStatus 
} = require('../services/aiTutorService');

// تسجيل دخول الطالب بحسابه الخاص
exports.studentLogin = async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone) {
      return res.status(400).json({ error: 'يرجى إدخال رقم الهاتف المسجل' });
    }

    // البحث عن الطالب برقم الهاتف أو رقم ولي الأمر
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
            teacher: {
              select: { name: true, centerName: true, phone: true }
            }
          }
        }
      }
    });

    if (!student) {
      return res.status(404).json({ error: 'لم يتم العثور على طالب مسجل بهذا الرقم. يرجى التواصل مع معلمك لإضافتك للمجموعة.' });
    }

    const token = jwt.sign(
      { id: student.id, name: student.name, role: 'STUDENT', groupId: student.groupId },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    const studentPayload = {
      id: student.id,
      name: student.name,
      role: 'STUDENT',
      groupName: student.group.name,
      subject: student.group.subject,
      teacherName: student.group.teacher.name,
      centerName: student.group.teacher.centerName
    };

    return res.json({
      message: 'تم تسجيل دخول الطالب بنجاح! 🎓',
      token,
      student: studentPayload,
      user: studentPayload
    });
  } catch (err) {
    console.error('Student login error:', err);
    return res.status(500).json({ error: 'فشل تسجيل الدخول للطالب' });
  }
};

// لوحة تحكم الطالب الكاملة (الامتحانات المتاحة، النتائج، وبنك الأخطاء للمراجعة)
exports.getStudentDashboard = async (req, res) => {
  try {
    const studentId = req.user.id;
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        group: {
          include: {
            teacher: {
              select: { name: true, centerName: true, phone: true }
            },
            exams: {
              include: {
                exam: {
                  include: {
                    accessCodes: { take: 1 },
                    _count: { select: { questions: true } }
                  }
                }
              }
            }
          }
        },
        attempts: {
          orderBy: { startedAt: 'desc' },
          include: {
            exam: {
              select: { id: true, title: true, type: true, totalDegree: true }
            },
            answers: {
              include: { question: true }
            }
          }
        }
      }
    });

    if (!student) {
      return res.status(404).json({ error: 'الطالب غير موجود' });
    }

    // جلب كل المجموعات والامتحانات التي ينتمي لها الطالب لدى مختلف المعلمين (Multi-Teacher & Multi-Subject)
    const searchConditions = [{ id: studentId }, { parentPhone: student.parentPhone }];
    if (student.studentPhone) searchConditions.push({ studentPhone: student.studentPhone });
    if (student.phone) searchConditions.push({ phone: student.phone });

    const matchingStudents = await prisma.student.findMany({
      where: { OR: searchConditions },
      include: {
        group: {
          include: {
            teacher: {
              select: { name: true, centerName: true, phone: true }
            },
            exams: {
              include: {
                exam: {
                  include: {
                    accessCodes: { take: 1 },
                    _count: { select: { questions: true } }
                  }
                }
              }
            }
          }
        },
        attempts: {
          orderBy: { startedAt: 'desc' },
          include: {
            exam: {
              select: { id: true, title: true, type: true, totalDegree: true }
            },
            answers: {
              include: { question: true }
            }
          }
        }
      }
    });

    // جلب كل محاولات الطالب المباشرة (عبر studentId أو رقم ولي الأمر أو الاسم)
    const allStudentIds = matchingStudents.map(ms => ms.id);
    const phoneConditions = [student.parentPhone];
    if (student.studentPhone) phoneConditions.push(student.studentPhone);
    if (student.phone) phoneConditions.push(student.phone);

    const allAttempts = await prisma.examAttempt.findMany({
      where: {
        OR: [
          { studentId: { in: allStudentIds } },
          { parentPhone: { in: phoneConditions.filter(Boolean) } },
          { studentName: student.name }
        ]
      },
      include: {
        exam: {
          select: {
            id: true,
            title: true,
            type: true,
            totalDegree: true,
            teacherId: true,
            teacher: { select: { name: true, centerName: true } },
            groups: { include: { group: { select: { subject: true, name: true } } } }
          }
        },
        answers: {
          include: { question: true }
        }
      },
      orderBy: { startedAt: 'desc' }
    });

    // ربط أي محاولات سابقة بنفس رقم الهاتف بحساب الطالب
    if (phoneConditions.filter(Boolean).length > 0) {
      await prisma.examAttempt.updateMany({
        where: {
          studentId: null,
          parentPhone: { in: phoneConditions.filter(Boolean) }
        },
        data: {
          studentId: student.id
        }
      });
    }

    const completedExamIds = new Set(allAttempts.filter(a => a.isCompleted).map(a => a.examId));
    
    // جمع كل الامتحانات المتاحة من جميع مجموعات المعلمين
    const availableExamsMap = new Map();
    const enrolledGroups = [];

    matchingStudents.forEach(ms => {
      if (ms.group) {
        enrolledGroups.push({
          id: ms.group.id,
          name: ms.group.name,
          subject: ms.group.subject,
          teacherName: ms.group.teacher?.name,
          centerName: ms.group.teacher?.centerName
        });

        if (Array.isArray(ms.group.exams)) {
          ms.group.exams.forEach(ge => {
            if (ge.exam && !completedExamIds.has(ge.exam.id) && !availableExamsMap.has(ge.exam.id)) {
              availableExamsMap.set(ge.exam.id, {
                id: ge.exam.id,
                title: ge.exam.title,
                durationMins: ge.exam.durationMins,
                totalDegree: ge.exam.totalDegree,
                type: ge.exam.type,
                questionsCount: ge.exam._count?.questions || 0,
                code: ge.exam.accessCodes?.[0]?.code || 'DIRECT',
                teacherName: ms.group.teacher?.name,
                subject: ms.group.subject
              });
            }
          });
        }
      }
    });

    // جلب كل امتحانات المعلمين (سواء الموجهة للمجموعة أو المفتوحة عامة)
    const teacherIds = [...new Set(matchingStudents.map(ms => ms.group?.teacherId).filter(Boolean))];
    const groupIds = matchingStudents.map(ms => ms.groupId).filter(Boolean);

    if (teacherIds.length > 0) {
      const allTeacherExams = await prisma.exam.findMany({
        where: {
          teacherId: { in: teacherIds },
          OR: [
            { groups: { some: { groupId: { in: groupIds } } } },
            { groups: { none: {} } }
          ]
        },
        include: {
          accessCodes: { take: 1 },
          _count: { select: { questions: true } },
          teacher: { select: { name: true, centerName: true } }
        }
      });

      allTeacherExams.forEach(ex => {
        if (!completedExamIds.has(ex.id) && !availableExamsMap.has(ex.id)) {
          availableExamsMap.set(ex.id, {
            id: ex.id,
            title: ex.title,
            durationMins: ex.durationMins,
            totalDegree: ex.totalDegree,
            type: ex.type,
            questionsCount: ex._count?.questions || 0,
            code: ex.accessCodes?.[0]?.code || 'DIRECT',
            teacherName: ex.teacher?.name,
            subject: matchingStudents.find(ms => ms.group?.teacherId === ex.teacherId)?.group?.subject || 'مادة'
          });
        }
      });
    }

    const availableExams = Array.from(availableExamsMap.values());

    // دالة مساعدة لتحديد المادة الدراسية بذكاء
    const detectSubject = (exam, teacherId) => {
      // 1. فحص اسم الامتحان أولاً إذا كان يحدد المادة بوضوح
      const titleLower = (exam?.title || '').toLowerCase();
      if (titleLower.includes('ماث') || titleLower.includes('رياض') || titleLower.includes('math')) return 'الرياضيات';
      if (titleLower.includes('فيزياء') || titleLower.includes('physics')) return 'الفيزياء';
      if (titleLower.includes('كيمياء') || titleLower.includes('chem')) return 'الكيمياء';
      if (titleLower.includes('أحياء') || titleLower.includes('bio')) return 'الأحياء';
      if (titleLower.includes('عربي') || titleLower.includes('نحو')) return 'اللغة العربية';
      if (titleLower.includes('إنجليز') || titleLower.includes('eng')) return 'اللغة الإنجليزية';
      if (titleLower.includes('فرنساوي') || titleLower.includes('french')) return 'اللغة الفرنسية';
      if (titleLower.includes('جيولوج')) return 'الجيولوجيا';

      // 2. فحص المادة المحددة في مجموعة الامتحان نفسه
      let subj = exam?.groups?.[0]?.group?.subject;
      if (subj) return subj;

      // 3. فحص المادة من المجموعة المسجل بها الطالب لدى المعلم
      const matched = matchingStudents.find(ms => ms.group?.teacherId === (teacherId || exam?.teacherId));
      if (matched?.group?.subject) return matched.group.subject;

      return 'مادة عامة';
    };

    // ملخص سجل الامتحانات المكتملة
    const completedExams = allAttempts
      .filter(a => a.isCompleted)
      .map(a => {
        const percentage = a.totalDegree > 0 ? Math.round((a.score / a.totalDegree) * 100) : 0;
        return {
          attemptId: a.id,
          examId: a.examId,
          examTitle: a.exam?.title || 'امتحان',
          subject: detectSubject(a.exam, a.exam?.teacherId),
          teacherName: a.exam?.teacher?.name || 'المعلم',
          score: a.score,
          totalDegree: a.totalDegree,
          percentage,
          tabSwitchCount: a.tabSwitchCount,
          submittedAt: a.submittedAt,
          isHonorRoll: percentage >= 85 // مؤهل لشهادة تقدير
        };
      });

    // بنك أخطائي الشخصي (My Error Bank) - ديناميكي لجميع المواد
    const errorBank = [];
    allAttempts.forEach(attempt => {
      if (Array.isArray(attempt.answers)) {
        const attemptSubject = detectSubject(attempt.exam, attempt.exam?.teacherId);
        attempt.answers.forEach(ans => {
          if (!ans.isCorrect && ans.question) {
            errorBank.push({
              id: ans.id,
              examId: attempt.examId,
              examTitle: attempt.exam?.title || 'امتحان',
              subject: attemptSubject,
              teacherName: attempt.exam?.teacher?.name || 'المعلم',
              questionIndex: ans.question.questionIndex,
              questionText: ans.question.text,
              studentAnswer: ans.answerGiven,
              correctAnswer: ans.question.correctAnswer,
              explanation: ans.question.explanation || 'راجع هذا المفهوم مع معلمك',
              degree: ans.question.degree,
              submittedAt: attempt.submittedAt
            });
          }
        });
      }
    });

    return res.json({
      student: {
        id: student.id,
        name: student.name,
        groupName: student.group.name,
        subject: student.group.subject,
        teacherName: student.group.teacher.name,
        centerName: student.group.teacher.centerName,
        enrolledGroups
      },
      availableExams,
      completedExams,
      errorBank,
      stats: {
        totalExamsTaken: completedExams.length,
        averagePercentage: completedExams.length > 0
          ? Math.round(completedExams.reduce((s, e) => s + e.percentage, 0) / completedExams.length)
          : 0,
        totalErrorsToRevise: errorBank.length
      }
    });
  } catch (err) {
    console.error('Student dashboard error:', err);
    return res.status(500).json({ error: 'فشل جلب لوحة تحكم الطالب' });
  }
};

// شرح السؤال بالذكاء الاصطناعي (AI Tutor Explainer) - مدعوم بـ Google Gemini و OpenAI الحقيقي
exports.aiExplainQuestion = async (req, res) => {
  try {
    const { 
      questionIndex, 
      studentAnswer, 
      correctAnswer, 
      examTitle, 
      questionText, 
      subject: inputSubject,
      teacherExplanation,
      teacherName
    } = req.body;

    // استنتاج المادة بدقة لتوليد شرح متخصص
    let subject = inputSubject;
    const titleLower = (examTitle || '').toLowerCase();
    if (!subject || subject === 'مادة عامة' || subject === 'مادة دراسية') {
      if (titleLower.includes('فيزياء') || titleLower.includes('physics')) subject = 'الفيزياء';
      else if (titleLower.includes('ماث') || titleLower.includes('رياض') || titleLower.includes('math')) subject = 'الرياضيات';
      else if (titleLower.includes('كيمياء') || titleLower.includes('chem')) subject = 'الكيمياء';
      else if (titleLower.includes('أحياء') || titleLower.includes('bio')) subject = 'الأحياء';
      else if (titleLower.includes('عربي') || titleLower.includes('نحو')) subject = 'اللغة العربية';
      else if (titleLower.includes('إنجليز') || titleLower.includes('eng')) subject = 'اللغة الإنجليزية';
      else if (titleLower.includes('جيولوج')) subject = 'الجيولوجيا';
      else subject = 'العلوم';
    }

    const aiResult = await generateAIExplanation({
      questionIndex,
      studentAnswer,
      correctAnswer,
      examTitle,
      questionText,
      subject,
      teacherExplanation,
      teacherName
    });

    const explanation = {
      questionNumber: questionIndex || 1,
      exam: examTitle || 'اختبار تقييمي',
      subject: subject,
      studentChoice: studentAnswer || 'غير محدد',
      correctChoice: correctAnswer || 'أ',
      analysis: aiResult.analysis,
      steps: aiResult.steps,
      goldenRule: aiResult.goldenRule,
      examTip: aiResult.examTip,
      provider: aiResult.provider,
      isLiveAI: aiResult.isLiveAI
    };

    return res.json({ success: true, explanation });
  } catch (err) {
    console.error('AI explanation error:', err);
    return res.status(500).json({ error: 'فشل توليد شرح الذكاء الاصطناعي' });
  }
};

// حالة مزود الذكاء الاصطناعي الحالي
exports.getAIStatus = async (req, res) => {
  try {
    const status = getAIConfigStatus();
    return res.json({ success: true, status });
  } catch (err) {
    return res.status(500).json({ error: 'فشل جلب حالة الذكاء الاصطناعي' });
  }
};

// حفظ وتحديث مفاتيح الـ API للذكاء الاصطناعي الحقيقي
exports.saveAIConfig = async (req, res) => {
  try {
    const { geminiKey, openaiKey } = req.body;
    const status = updateApiKeyConfig({ geminiKey, openaiKey });
    return res.json({ success: true, message: 'تم حفظ إعدادات الذكاء الاصطناعي بنجاح', status });
  } catch (err) {
    console.error('Save AI config error:', err);
    return res.status(500).json({ error: 'فشل حفظ إعدادات الذكاء الاصطناعي' });
  }
};

// ==========================================================
// محادثة تفاعلية مباشرة مع المعلم الذكي (مستر كَنترول)
// ==========================================================
exports.aiChat = async (req, res) => {
  try {
    const { message, history = [], subject, contextQuestion } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'رسالة السؤال مطلوبة' });
    }

    // جلب بيانات الطالب
    const student = await prisma.student.findUnique({
      where: { id: req.user.id },
      include: {
        group: {
          select: { name: true, subject: true }
        }
      }
    });

    const studentName = student?.name || req.user.name || 'يا بطل';
    const activeSubject = subject || student?.group?.subject || 'الفيزياء';

    const result = await chatWithAITutor({
      message: message.trim(),
      history,
      studentName,
      subject: activeSubject,
      contextQuestion
    });

    return res.json({
      success: true,
      reply: result.reply,
      provider: result.provider,
      isLiveAI: result.isLiveAI,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('AI Chat Error:', err);
    return res.status(500).json({ error: 'تعذر التواصل مع المعلم الذكي حالياً، يرجى المحاولة بعد قليل.' });
  }
};

