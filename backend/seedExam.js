const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const teacher = await prisma.teacher.findFirst({ include: { groups: true } });
  if (!teacher) {
    console.log('No teacher found');
    return;
  }

  const existingExam = await prisma.exam.findFirst({ where: { teacherId: teacher.id } });
  if (existingExam) {
    console.log('Exam already exists');
    return;
  }

  const exam = await prisma.exam.create({
    data: {
      title: 'مراجعة سريعة في الفيزياء (نموذج تجريبي)',
      type: 'ANSWER_SHEET',
      durationMins: 30,
      totalDegree: 5,
      teacherId: teacher.id,
      questions: {
        create: [
          { questionIndex: 1, correctAnswer: 'ب', degree: 1 },
          { questionIndex: 2, correctAnswer: 'أ', degree: 1 },
          { questionIndex: 3, correctAnswer: 'ب', degree: 1 },
          { questionIndex: 4, correctAnswer: 'ج', degree: 1 },
          { questionIndex: 5, correctAnswer: 'د', degree: 1 }
        ]
      },
      accessCodes: {
        create: [
          { code: 'PHY101', studentName: 'عام' }
        ]
      },
      attempts: {
        create: [
          {
            studentName: 'محمد علي حسن',
            parentPhone: '01099887766',
            score: 5,
            totalDegree: 5,
            isCompleted: true,
            tabSwitchCount: 0,
            submittedAt: new Date()
          },
          {
            studentName: 'عمر شريف إبراهيم',
            parentPhone: '01122334455',
            score: 4,
            totalDegree: 5,
            isCompleted: true,
            tabSwitchCount: 1,
            submittedAt: new Date()
          },
          {
            studentName: 'مريم عادل محمود',
            parentPhone: '01233445566',
            score: 3,
            totalDegree: 5,
            isCompleted: true,
            tabSwitchCount: 3,
            submittedAt: new Date()
          }
        ]
      }
    }
  });

  console.log('✅ تم إنشاء امتحان تجريبي بكود الدخول: PHY101');
}

main().finally(() => prisma.$disconnect());
