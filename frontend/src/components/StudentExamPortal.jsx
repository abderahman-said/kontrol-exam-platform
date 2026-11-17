import React, { useState, useEffect, useRef } from 'react';
import { 
  Clock, ShieldAlert, CheckCircle2, AlertTriangle, ArrowLeft, 
  Send, HelpCircle, FileText, CheckCircle, Award, LayoutDashboard, ExternalLink
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { examsAPI } from '../services/api';
import Logo from './Logo';

export default function StudentExamPortal({ initialCode = '', onExit }) {
  // شاشات: 'join' | 'in_exam' | 'submitted'
  const [stage, setStage] = useState('join');
  const [code, setCode] = useState(initialCode);
  const [studentName, setStudentName] = useState(() => {
    try {
      const u = JSON.parse(localStorage.getItem('student_user') || '{}');
      return u.name || '';
    } catch (e) { return ''; }
  });
  const [parentPhone, setParentPhone] = useState(() => {
    try {
      const u = JSON.parse(localStorage.getItem('student_user') || '{}');
      return u.parentPhone || u.phone || '';
    } catch (e) { return ''; }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // بدء الدخول التلقائي إذا كان الطالب مسجلاً ولديه كود ممرر من لوحة التحكم
  useEffect(() => {
    if (initialCode && stage === 'join') {
      try {
        const u = JSON.parse(localStorage.getItem('student_user') || '{}');
        if (u && u.name) {
          executeJoin(initialCode, u.name, u.parentPhone || u.phone || '', u.id);
        }
      } catch (e) {}
    }
  }, [initialCode]);

  const executeJoin = async (targetCode, targetName, targetPhone, targetStudentId) => {
    setLoading(true);
    setError('');

    try {
      const res = await examsAPI.studentJoin({
        code: targetCode,
        studentName: targetName,
        parentPhone: targetPhone,
        studentId: targetStudentId
      });

      const { exam, attemptId: newAttemptId } = res.data;
      setExamData(exam);
      setAttemptId(newAttemptId);
      setTimeLeft(exam.durationMins * 60);

      // استعادة إجابات مخزنة مؤقتاً لو النت قطع
      const saved = localStorage.getItem(`exam_answers_${newAttemptId}`);
      if (saved) {
        try { setAnswers(JSON.parse(saved)); } catch (err) {}
      }

      setStage('in_exam');
    } catch (err) {
      setError(err.response?.data?.error || 'كود الامتحان غير صحيح أو انتهى وقته');
    } finally {
      setLoading(false);
    }
  };

  // الانضمام للامتحان يدوياً
  const handleJoin = async (e) => {
    e.preventDefault();
    if (!code || !studentName) {
      setError('يرجى كتابة كود الامتحان واسم الطالب');
      return;
    }

    let sId = null;
    try {
      const u = JSON.parse(localStorage.getItem('student_user') || '{}');
      sId = u.id || null;
    } catch (e) {}

    executeJoin(code, studentName, parentPhone, sId);
  };

  // محرك مكافحة الغش المحصن (Anti-Cheat Hardened Engine)
  const lastCheatTriggerRef = useRef(0);

  useEffect(() => {
    if (stage !== 'in_exam' || !attemptId) return;

    // دالة تسجيل مخالفة الغش مع حماية Debounce لمنع التكرار اللحظي
    const triggerCheatViolation = (reason, description) => {
      const now = Date.now();
      if (now - lastCheatTriggerRef.current < 2000) {
        return; // حظر تكرار الإنذار في أقل من ثانيتين
      }
      lastCheatTriggerRef.current = now;
      setTabSwitchCount(prev => prev + 1);
      setCheatAlert(true);
      examsAPI.logCheatEvent(attemptId, reason);
    };

    // 1. رصد مغادرة التاب الحقيقية فقط (التبديل لتاب آخر أو تصغير المتصفح)
    // لا يتأثر إطلاقاً بالنقر على الشاشة أو النقر داخل ملف الـ PDF
    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerCheatViolation('TAB_SWITCH', 'مغادرة تاب الامتحان أو التبديل لبرنامج آخر');
      }
    };

    // 2. حظر اختصارات لوحة المفاتيح المخصصة للتصوير والغش وأدوات المطورين
    const handleKeyDown = (e) => {
      // حظر F12
      if (e.key === 'F12') {
        e.preventDefault();
        triggerCheatViolation('DEVTOOLS', 'محاولة فتح أدوات فحص المطورين (F12)');
      }
      // حظر Ctrl+Shift+I / Ctrl+Shift+J / Ctrl+Shift+C / Ctrl+U
      if (e.ctrlKey && (e.shiftKey && ['I', 'J', 'C', 'i', 'j', 'c'].includes(e.key) || ['u', 'U'].includes(e.key))) {
        e.preventDefault();
        triggerCheatViolation('DEVTOOLS', 'محاولة فحص عناصر الصفحة أو سورس الامتحان');
      }
      // حظر نسخ أو قص نصوص الامتحان
      if (e.ctrlKey && ['c', 'v', 'a', 'C', 'V', 'A'].includes(e.key)) {
        e.preventDefault();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [stage, attemptId]);

  // مؤقت الامتحان التنازلي
  useEffect(() => {
    if (stage !== 'in_exam' || timeLeft <= 0) return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [stage]);

  // حفظ الإجابات محلياً واختيار إجابة
  const handleSelectAnswer = (qId, option) => {
    const updated = { ...answers, [qId]: option };
    setAnswers(updated);
    if (attemptId) {
      localStorage.setItem(`exam_answers_${attemptId}`, JSON.stringify(updated));
    }
  };

  // تسليم تلقائي عند نفاد الوقت
  const handleAutoSubmit = () => {
    alert('⏱️ انتهى وقت الامتحان! سيتم تسليم إجاباتك تلقائياً الآن.');
    submitAnswers();
  };

  // تسليم الامتحان يدوياً
  const submitAnswers = async () => {
    if (!attemptId || !examData) return;
    setLoading(true);

    try {
      const formattedAnswers = examData.questions.map(q => ({
        questionId: q.id,
        answerGiven: answers[q.id] || ''
      }));

      const res = await examsAPI.submitAttempt(attemptId, formattedAnswers);
      setResult(res.data);
      setStage('submitted');

      // إطلاق احتفال Confetti
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {}

      // تنظيف الكاش المحلي
      localStorage.removeItem(`exam_answers_${attemptId}`);
    } catch (err) {
      alert(err.response?.data?.error || 'حدث خطأ أثناء تسليم الامتحان');
    } finally {
      setLoading(false);
    }
  };

  // تنسيق وقت المؤقت
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = examData?.questions?.length || 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 text-right">

      {/* ==================== 1. شاشة إدخال الكود ==================== */}
      {stage === 'join' && (
        <div className="max-w-md mx-auto bg-white rounded-[2rem] p-8 border border-slate-200/90 shadow-xl">
          <div className="flex justify-center mb-5">
            <Logo size="md" />
          </div>

          <h1 className="text-xl font-black text-center text-[#03243F] mb-1">
            دخول اختبار أو واجب إلكتروني
          </h1>
          <p className="text-xs text-center text-slate-500 font-bold mb-6">
            أدخل كود الامتحان المُستلم من المعلم أو السنتر لبدء الحل
          </p>

          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs font-bold mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1.5">كود الامتحان *</label>
              <input
                type="text"
                placeholder="مثال: ABC123"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-3 text-center text-lg font-mono font-black tracking-widest uppercase focus:border-[#02936C] focus:ring-2 focus:ring-[#02936C]/20 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 mb-1.5">اسم الطالب ثلاثي *</label>
              <input
                type="text"
                placeholder="اكتب اسمك بالكامل"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-3 text-xs font-bold focus:border-[#02936C] focus:ring-2 focus:ring-[#02936C]/20 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 mb-1.5">رقم هاتف ولي الأمر (واتساب)</label>
              <input
                type="tel"
                placeholder="010XXXXXXXX"
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-3 text-xs font-bold focus:border-[#02936C] focus:ring-2 focus:ring-[#02936C]/20 focus:outline-none text-left font-mono"
              />
              <span className="text-[10px] text-slate-400 font-bold mt-1 block">لإرسال شهادة النتيجة وتقرير الأداء لولي الأمر مباشرة.</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#02936C] hover:bg-[#027d5c] disabled:opacity-50 text-white font-black py-3.5 rounded-xl shadow-lg shadow-[#02936C]/20 transition flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
            >
              {loading ? 'جاري التحقق...' : 'بدء الامتحان الآن 🚀'}
            </button>
          </form>
        </div>
      )}

      {/* ==================== 2. شاشة الامتحان النشط (Split View) ==================== */}
      {stage === 'in_exam' && examData && (
        <div 
          className="space-y-4 select-none"
          onContextMenu={(e) => e.preventDefault()}
        >
          
          {/* Header Bar */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-4 z-20">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900">{examData.title}</h2>
                {tabSwitchCount > 0 && (
                  <span className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3 text-red-600" />
                    رُصدت مغادرة: {tabSwitchCount} مرات
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                الطالب: <span className="font-bold text-slate-700">{studentName}</span> • تم حل {answeredCount} من {totalQuestions}
              </p>
            </div>

            {/* Countdown Timer */}
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-mono text-base font-bold shadow-xs ${
                timeLeft < 300
                  ? 'bg-red-50 text-red-600 border border-red-200 animate-pulse'
                  : 'bg-slate-100 text-slate-800 border border-slate-200'
              }`}>
                <Clock className="w-4 h-4" />
                <span>{formatTime(timeLeft)}</span>
              </div>

              <button
                onClick={() => {
                  if (confirm('هل أنت متأكد من تسليم الإجابات وإنهاء الامتحان؟')) {
                    submitAnswers();
                  }
                }}
                disabled={loading}
                className="bg-[#02936C] hover:bg-[#027d5c] text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-md shadow-[#02936C]/20 transition flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>تسليم الامتحان</span>
              </button>
            </div>
          </div>

          {/* تنبيه مكافحة الغش الصارم (ظاهر بالكامل كـ Modal أعلى كل عناصر الشاشة بـ z-50) */}
          {cheatAlert && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4">
              <div className="bg-red-600 text-white rounded-3xl p-6 max-w-md w-full shadow-2xl border-2 border-red-400 space-y-4 text-right animate-in fade-in zoom-in-95 duration-150">
                
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 shadow-inner">
                    <ShieldAlert className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base">تحذير أمني: لقد غادرت صفحة الامتحان!</h3>
                    <p className="text-xs text-red-100 mt-0.5">
                      تم رصد مغادرة التاب أو الانتقال لبرنامج آخر
                    </p>
                  </div>
                </div>

                <div className="bg-black/25 p-4 rounded-2xl text-xs space-y-1.5 border border-white/10">
                  <p className="font-black text-amber-200 text-xs flex items-center gap-1.5">
                    ⚠️ تم تسجيل هذه الحركة ({tabSwitchCount} مرات حتى الآن):
                  </p>
                  <p className="text-red-100 text-[11px] leading-relaxed">
                    يتم تسجيل عدد مرات مغادرة الشاشة وإرسالها فوراً لتقرير كشف الغش للمدرس، وستصل لولي الأمر عبر رسالة واتساب مع شهادة النتيجة.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setCheatAlert(false)}
                  className="w-full py-3 bg-white hover:bg-red-50 active:bg-red-100 text-red-700 font-black rounded-2xl text-sm transition shadow-lg flex items-center justify-center gap-2"
                >
                  <span>فهمت، العودة للحل والتركيز الآن</span>
                </button>
              </div>
            </div>
          )}

          {/* Dual / Split View: ورقة الأسئلة + البابل شيت */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* الجانب الأيمن: عارض ورقة الأسئلة (PDF أو صور) */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-4 shadow-xs min-h-[500px] flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-brand-600" />
                  ورقة الأسئلة
                </span>
                <span className="text-[11px] text-slate-400">اقرأ السؤال وظلل الحرف المقابل في ورقة الإجابة</span>
              </div>

              {examData.pdfUrl ? (
                <div className="flex-1 w-full bg-slate-100 rounded-2xl overflow-hidden min-h-[500px] relative select-none">
                  {/* علامة مائية ديناميكية مكررة باسم ورقم الطالب لمنع تصوير الشاشة وتسريب مذكرات المعلم */}
                  <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden flex flex-wrap items-center justify-around gap-12 p-6 select-none opacity-20">
                    {Array.from({ length: 9 }).map((_, idx) => (
                      <div key={idx} className="rotate-[-25deg] text-center font-bold font-mono text-slate-800 text-xs sm:text-sm whitespace-nowrap">
                        <p>{studentName || 'طالب كَنترول'}</p>
                        <p className="text-[10px] tracking-wider">{parentPhone || 'حماية كَنترول'}</p>
                        <p className="text-[9px] text-slate-500">{new Date().toLocaleDateString('ar-EG')}</p>
                      </div>
                    ))}
                  </div>

                  <iframe
                    src={`${(import.meta.env.VITE_API_BASE_URL || '').replace(/\/api\/?$/, '') || (import.meta.env.PROD ? '' : 'http://localhost:5000')}${examData.pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                    className="w-full h-full min-h-[550px] border-0"
                    title="Exam Questions PDF"
                  />
                </div>
              ) : (
                <div className="flex-1 flex flex-col p-4 space-y-3 overflow-y-auto max-h-[600px] relative">
                  {/* علامة مائية احتياطية */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden flex flex-wrap items-center justify-around gap-12 p-6 opacity-10">
                    {Array.from({ length: 6 }).map((_, idx) => (
                      <div key={idx} className="rotate-[-25deg] text-center font-bold font-mono text-slate-700 text-xs">
                        <p>{studentName}</p>
                        <p className="text-[10px]">{parentPhone}</p>
                      </div>
                    ))}
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-2">
                    <p className="text-xs font-bold text-slate-700">📝 كشف نصوص الأسئلة المباشرة:</p>
                    <p className="text-[11px] text-slate-400">اقرأ السؤال وظلل اختيارك في ورقة البابل شيت المقابلة على اليسار</p>
                  </div>

                  {examData.questions && examData.questions.length > 0 ? (
                    examData.questions.map((q) => {
                      let questionTitle = q.text || `السؤال رقم ${q.questionIndex}`;
                      let customOptions = null;
                      try {
                        if (q.text && q.text.startsWith('{')) {
                          const parsed = JSON.parse(q.text);
                          if (parsed.question) questionTitle = parsed.question;
                          if (parsed.options) customOptions = parsed.options;
                        }
                      } catch (e) {}

                      return (
                        <div key={q.id} className="p-4 bg-slate-50/70 border border-slate-200 rounded-2xl text-right space-y-2.5">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-black text-slate-900 leading-relaxed">
                              <span className="text-[#02936C] ml-1">#{q.questionIndex}</span> {questionTitle}
                            </p>
                            <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                              {q.degree || 1} درجة
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                            {['أ', 'ب', 'ج', 'د'].map((letter) => {
                              const optionText = customOptions ? (customOptions[letter] || '') : '';
                              return (
                                <div key={letter} className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center gap-2">
                                  <span className="w-6 h-6 rounded-lg bg-emerald-50 text-[#02936C] font-black inline-flex items-center justify-center shrink-0">
                                    {letter}
                                  </span>
                                  <span className="font-bold text-slate-800">
                                    {optionText || `الخيار (${letter})`}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-8 text-center text-slate-400">
                      <FileText className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-bold text-slate-600">ورقة الأسئلة وزعت ورقياً في السنتر</p>
                      <p className="text-xs">ظلل إجاباتك على البابل شيت الديجيتال على اليسار.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* الجانب الأيسر: شريط ورقة الإجابة التفاعلية (Bubble Sheet) */}
            <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <span className="text-sm font-black text-[#03243F]">ورقة الإجابة (البابل شيت)</span>
                <span className="text-xs bg-emerald-50 text-[#02936C] font-black px-2.5 py-1 rounded-xl border border-emerald-200">
                  {answeredCount} / {totalQuestions} سؤال
                </span>
              </div>

              {/* شبكة الأسئلة والإجابات */}
              <div className="space-y-2.5 max-h-[550px] overflow-y-auto pr-1">
                {examData.questions.map((q) => {
                  const currentSelected = answers[q.id];
                  return (
                    <div
                      key={q.id}
                      className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                        currentSelected
                          ? 'bg-emerald-50/40 border-[#02936C]'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {/* أزرار الاختيارات أ، ب، ج، د */}
                      <div className="flex items-center gap-2">
                        {['أ', 'ب', 'ج', 'د'].map((opt) => {
                          const isPicked = currentSelected === opt;
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => handleSelectAnswer(q.id, opt)}
                              className={`w-9 h-9 rounded-full text-xs font-black transition-all flex items-center justify-center ${
                                isPicked
                                  ? 'bg-[#02936C] text-white shadow-md shadow-[#02936C]/30 scale-105'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              }`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>

                      {/* رقم السؤال */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400">({q.degree} د)</span>
                        <span className="w-8 h-8 rounded-xl bg-slate-100 text-[#03243F] text-xs font-black flex items-center justify-center border border-slate-200">
                          #{q.questionIndex}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* زر التسليم في أسفل القائمة */}
              <div className="mt-5 pt-4 border-t border-slate-100">
                <button
                  onClick={() => {
                    if (confirm('هل أنت متأكد من تسليم الإجابات الآن؟')) {
                      submitAnswers();
                    }
                  }}
                  disabled={loading}
                  className="w-full bg-[#03243F] hover:bg-[#063154] text-white py-3.5 rounded-2xl text-xs font-black shadow-md transition flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4 text-[#02936C]" />
                  <span>تأكيد وتسليم الامتحان النهائي</span>
                </button>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* ==================== 3. شاشة إعلان النتيجة والاحتفال ==================== */}
      {stage === 'submitted' && result && (
        <div className="max-w-lg mx-auto bg-white rounded-[2.5rem] p-6 sm:p-8 border border-slate-200/90 shadow-2xl text-center space-y-5 animate-in zoom-in-95">
          <div className="w-16 h-16 bg-emerald-50 text-[#02936C] rounded-3xl flex items-center justify-center mx-auto border-2 border-emerald-200 shadow-lg shadow-[#02936C]/20">
            <CheckCircle className="w-10 h-10" />
          </div>

          <div>
            <h2 className="text-2xl font-black text-[#03243F]">تم تسليم الامتحان وتصحيحه بنجاح! 🎉</h2>
            <p className="text-xs text-slate-500 font-bold mt-1">
              عاش يا بطل! تم حفظ درجاتك في سجلك الأكاديمي، وتم إرسال التقرير لولي الأمر تلقائياً.
            </p>
          </div>

          {/* كارت الدرجة المنسق */}
          <div className="p-6 bg-gradient-to-br from-emerald-50 via-teal-50/50 to-slate-50 border border-emerald-200 rounded-3xl relative overflow-hidden">
            <div className="absolute top-3 left-3">
              <span className={`text-[11px] font-black px-3 py-1 rounded-full border ${
                (result.score / result.totalDegree) >= 0.85
                  ? 'bg-emerald-100 text-[#02936C] border-emerald-300'
                  : (result.score / result.totalDegree) >= 0.65
                  ? 'bg-blue-100 text-blue-800 border-blue-300'
                  : 'bg-amber-100 text-amber-800 border-amber-300'
              }`}>
                {(result.score / result.totalDegree) >= 0.85 ? '🌟 ممتاز جداً' : (result.score / result.totalDegree) >= 0.65 ? '👏 جيد جداً' : '👍 تم الاجتياز'}
              </span>
            </div>

            <p className="text-xs font-black text-slate-500 mb-1">درجتك النهائية</p>
            <div className="text-5xl font-black text-[#03243F] font-mono tracking-tight">
              {result.score} <span className="text-2xl text-[#02936C] font-normal">/ {result.totalDegree}</span>
            </div>
            <div className="mt-2 text-xs font-black text-slate-600">
              النسبة المئوية: {result.totalDegree > 0 ? Math.round((result.score / result.totalDegree) * 100) : 0}%
            </div>
          </div>

          {/* تنبيه الغش إذا كان هناك خروج */}
          {result.tabSwitchCount > 0 && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs text-right space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                <span>سُجل في تقريرك مغادرة شاشة الامتحان ({result.tabSwitchCount} مرات).</span>
              </p>
              <p className="text-[11px] text-amber-700">
                تم توثيق ذلك في كشف درجات المدرس وتقارير أولياء الأمور تلقائياً.
              </p>
            </div>
          )}

          {/* أزرار الإجراءات الأساسية */}
          <div className="space-y-2.5 pt-2">
            {/* 1. الزر الأساسي: الذهاب للوحة تحكم الطالب */}
            <button
              onClick={() => {
                if (onExit) {
                  onExit();
                } else {
                  window.location.href = '/student/dashboard';
                }
              }}
              className="w-full bg-[#02936C] hover:bg-[#027d5c] text-white font-black py-3.5 rounded-2xl text-xs sm:text-sm shadow-lg shadow-[#02936C]/25 transition flex items-center justify-center gap-2 transform active:scale-98"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>الانتقال إلى لوحة تحكم الطالب ومتابعة نتائجي 📊</span>
            </button>

            {/* 2. زر عرض تقرير النتيجة المباشر */}
            {result.attemptId && (
              <a
                href={`/parent/report/${result.attemptId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold py-3 rounded-2xl text-xs transition flex items-center justify-center gap-2 shadow-2xs"
              >
                <ExternalLink className="w-4 h-4 text-[#02936C]" />
                <span>عرض كشف النتيجة التفصيلي (شهادة الطالب) 📑</span>
              </a>
            )}

            {/* 3. زر حل امتحان آخر */}
            <button
              onClick={() => {
                setStage('join');
                setExamData(null);
                setAnswers({});
                setCode('');
              }}
              className="w-full text-slate-500 hover:text-slate-800 text-xs font-bold py-2 transition"
            >
              حل امتحان آخر بكود جديد ✍️
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
