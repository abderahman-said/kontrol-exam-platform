const prisma = require('../prisma');
const bcrypt = require('bcryptjs');

exports.getGroups = async (req, res) => {
  try {
    const groups = await prisma.group.findMany({
      where: { teacherId: req.user.id },
      include: {
        _count: {
          select: { students: true, exams: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.json({ groups });
  } catch (err) {
    return res.status(500).json({ error: 'حدث خطأ أثناء جلب المجموعات' });
  }
};

exports.createGroup = async (req, res) => {
  try {
    const { name, subject } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'اسم المجموعة مطلوب' });
    }

    const group = await prisma.group.create({
      data: {
        name,
        subject: subject || '',
        teacherId: req.user.id
      }
    });

    return res.status(201).json({ group, message: 'تم إنشاء المجموعة بنجاح' });
  } catch (err) {
    return res.status(500).json({ error: 'فشل إنشاء المجموعة' });
  }
};

exports.getGroupById = async (req, res) => {
  try {
    const { id } = req.params;
    const group = await prisma.group.findFirst({
      where: { id, teacherId: req.user.id },
      include: {
        students: {
          orderBy: { name: 'asc' }
        }
      }
    });

    if (!group) {
      return res.status(404).json({ error: 'المجموعة غير موجودة' });
    }

    return res.json({ group });
  } catch (err) {
    return res.status(500).json({ error: 'فشل جلب تفاصيل المجموعة' });
  }
};

exports.addStudent = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { name, studentPhone, parentPhone } = req.body;

    if (!name || !parentPhone) {
      return res.status(400).json({ error: 'اسم الطالب ورقم ولي الأمر مطلوبان' });
    }

    // تأكد من أن المجموعة تخص المعلم
    const group = await prisma.group.findFirst({
      where: { id: groupId, teacherId: req.user.id }
    });
    if (!group) {
      return res.status(403).json({ error: 'غير مصرح بالإضافة لهذه المجموعة' });
    }

    // فحص رصيد سعة الطلاب المشحونة للمعلم (لضمان نسبة المنصة مقدماً)
    const teacher = await prisma.teacher.findUnique({
      where: { id: req.user.id },
      include: {
        groups: {
          include: { _count: { select: { students: true } } }
        }
      }
    });

    const activeStudentsCount = teacher.groups.reduce((acc, g) => acc + (g._count.students || 0), 0);
    const studentLimit = teacher.studentLimit || 30;

    if (activeStudentsCount >= studentLimit) {
      return res.status(403).json({
        error: `عفواً، لقد استهلكت رصيد الطلاب المشحون لديك بالكامل (${studentLimit} طالب). يرجى شحن رصيد طلاب إضافي لسداد نسبة المنصة والمتابعة.`
      });
    }

    const defaultPassHash = await bcrypt.hash('123456', 10);

    const student = await prisma.student.create({
      data: {
        name: name.trim(),
        studentPhone: studentPhone ? studentPhone.trim() : '',
        parentPhone: parentPhone.trim(),
        passwordHash: defaultPassHash,
        groupId
      }
    });

    return res.status(201).json({ student, message: 'تمت إضافة الطالب بنجاح، وكلمة مروره الافتراضية 123456' });
  } catch (err) {
    console.error('Add student error:', err);
    return res.status(500).json({ error: 'فشل إضافة الطالب' });
  }
};

// إضافة دفعة طلاب دفعة واحدة (Bulk / Excel Import)
exports.addStudentsBatch = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { students = [] } = req.body;

    const group = await prisma.group.findFirst({
      where: { id: groupId, teacherId: req.user.id }
    });
    if (!group) {
      return res.status(403).json({ error: 'غير مصرح بالإضافة لهذه المجموعة' });
    }

    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ error: 'يرجى إرسال قائمة طلاب صالحة' });
    }

    // فحص رصيد سعة الطلاب المشحونة للمعلم
    const teacher = await prisma.teacher.findUnique({
      where: { id: req.user.id },
      include: {
        groups: {
          include: { _count: { select: { students: true } } }
        }
      }
    });

    const activeStudentsCount = teacher.groups.reduce((acc, g) => acc + (g._count.students || 0), 0);
    const studentLimit = teacher.studentLimit || 30;
    const availableSlots = Math.max(0, studentLimit - activeStudentsCount);

    if (students.length > availableSlots) {
      return res.status(403).json({
        error: `رصيد الطلاب المتبقي في باقتك (${availableSlots} طالب) أقل من عدد الطلاب المطلوب إضافتهم (${students.length} طالب). يرجى شحن رصيد إضافي لسداد نسبة المنصة.`
      });
    }

    const defaultPassHash = await bcrypt.hash('123456', 10);
    const created = [];

    for (const s of students) {
      if (s.name && (s.parentPhone || s.studentPhone)) {
        const student = await prisma.student.create({
          data: {
            name: s.name.trim(),
            studentPhone: s.studentPhone ? s.studentPhone.trim() : '',
            parentPhone: s.parentPhone ? s.parentPhone.trim() : (s.studentPhone || ''),
            passwordHash: defaultPassHash,
            groupId
          }
        });
        created.push(student);
      }
    }

    return res.status(201).json({
      message: `تمت إضافة ${created.length} طالب بنجاح!`,
      count: created.length
    });
  } catch (err) {
    console.error('Batch add students error:', err);
    return res.status(500).json({ error: 'فشل استيراد قائمة الطلاب' });
  }
};

exports.deleteGroup = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.group.deleteMany({
      where: { id, teacherId: req.user.id }
    });
    return res.json({ message: 'تم حذف المجموعة بنجاح' });
  } catch (err) {
    return res.status(500).json({ error: 'فشل حذف المجموعة' });
  }
};
