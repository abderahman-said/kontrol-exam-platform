/**
 * توليد رابط واتساب لمشاركة نتيجة الامتحان مع ولي الأمر
 */
export function createParentResultWhatsAppLink(parentPhone, studentName, examTitle, score, totalDegree, cheatCount, attemptId) {
  if (!parentPhone) return '#';
  
  // تنظيف رقم الهاتف المصري (010, 011, 012, 015) وتحويله إلى صيغة دولية (2010...)
  let cleanPhone = parentPhone.trim().replace(/[^0-9]/g, '');
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '2' + cleanPhone;
  }

  const percentage = totalDegree > 0 ? Math.round((score / totalDegree) * 100) : 0;
  let statusEmoji = percentage >= 85 ? '🌟 ممتاز جداً' : percentage >= 70 ? '👏 جيد جداً' : percentage >= 50 ? '👍 تم الاجتياز' : '⚠️ يحتاج للمتابعة والمذاكرة';

  let message = `السلام عليكم ورحمة الله وبركاته 🌹%0A` +
    `نود إبلاغ سيادتكم بنتيجة امتحان: *${examTitle}*%0A` +
    `الطالب: *${studentName}*%0A` +
    `الدرجة: *${score} من ${totalDegree}* (${percentage}%)%0A` +
    `التقييم: *${statusEmoji}*%0A`;

  if (cheatCount && cheatCount > 0) {
    message += `⚠️ *ملاحظة النظام:* تم رصد مغادرة صفحة الامتحان أثناء الحل ${cheatCount} مرات.%0A`;
  }

  if (attemptId) {
    const reportUrl = `${window.location.origin}/parent/report/${attemptId}`;
    message += `%0A📄 *رابط التقرير الكامل وشهادة التقدير:*%0A${reportUrl}%0A`;
  }

  message += `%0Aمع تمنياتنا للطالب بالتوفيق والتميز المستمر 📚`;

  return `https://wa.me/${cleanPhone}?text=${message}`;
}

/**
 * توليد رابط واتساب لنشر الامتحان في جروب الدفعة / السنتر
 */
export function createExamShareWhatsAppLink(examTitle, code, durationMins, totalQuestions) {
  const message = `📢 *تنبيه هام للطلاب الأعزاء:*%0A` +
    `تم فتح امتحان جديد: *${examTitle}*%0A` +
    `⏱️ مدة الامتحان: *${durationMins} دقيقة*%0A` +
    `📝 عدد الأسئلة: *${totalQuestions} سؤال*%0A%0A` +
    `🔑 كود الدخول الخاص بكم: *${code}*%0A` +
    `يمكنكم الدخول عبر المنصة وبدء الحل الآن فوراً بالتوفيق للجميع! 🎯`;

  return `https://wa.me/?text=${message}`;
}
