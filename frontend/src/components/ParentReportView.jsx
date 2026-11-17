import React, { useState, useEffect } from 'react';
import { 
  Award, CheckCircle, AlertTriangle, Printer, 
  HelpCircle, ShieldCheck, Share2, ArrowRight, BookOpen, Clock, Sparkles
} from 'lucide-react';
import { examsAPI } from '../services/api';
import Logo from './Logo';

export default function ParentReportView({ attemptId, onBack }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (attemptId) {
      loadReport();
    }
  }, [attemptId]);

  const loadReport = async () => {
    try {
      setLoading(true);
      const res = await examsAPI.getParentReport(attemptId);
      setReport(res.data.report);
    } catch (err) {
      console.error(err);
      setError('تعذر تحميل تقرير النتيجة. تأكد من صحة الرابط أو تواصل مع المعلم.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-10 h-10 border-4 border-[#02936C] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-bold text-[#03243F]">جاري تحميل تقرير الطالب المعتمد من منصة كَنترول...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-3xl border border-red-200 text-center shadow-lg">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h2 className="text-base font-extrabold text-[#03243F] mb-1">عفواً، التقرير غير متوفر</h2>
        <p className="text-xs text-slate-500 mb-6">{error || 'لم يتم العثور على النتيجة'}</p>
        {onBack && (
          <button
            onClick={onBack}
            className="bg-[#03243F] text-white px-5 py-2.5 rounded-xl text-xs font-bold"
          >
            العودة للرئيسية
          </button>
        )}
      </div>
    );
  }

  const { percentage, isHonored } = report;

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-right pb-16 print:p-0 print:m-0 font-cairo selection:bg-[#02936C] selection:text-white">
      
      {/* Top Header */}
      <div className="flex items-center justify-between print:hidden">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#03243F] transition"
          >
            <ArrowRight className="w-4 h-4 text-[#02936C]" />
            العودة
          </button>
        )}
        <div className="flex items-center gap-3">
          <Logo size="sm" />
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-[#03243F] hover:bg-[#063154] text-white px-4 py-2.5 rounded-xl text-xs font-black shadow-md transition"
          >
            <Printer className="w-4 h-4 text-[#02936C]" />
            <span>طباعة الشهادة الرسمية</span>
          </button>
        </div>
      </div>

      {/* Main Student Score Card */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
        
        {/* Exam and Teacher Branding */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-[#02936C] bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full inline-block">
              📄 كشف درجات معتمد لولي الأمر
            </span>
            <h1 className="text-2xl font-black text-[#03243F]">{report.examTitle}</h1>
            <p className="text-xs text-slate-500 font-bold">
              المعلم: <strong className="text-[#03243F]">{report.teacherName}</strong> {report.centerName ? `• ${report.centerName}` : ''}
            </p>
          </div>

          <div className="text-left bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 shrink-0">
            <p className="text-xs font-black text-[#03243F]">{report.studentName}</p>
            <p className="text-[10px] text-slate-400 font-bold mt-0.5">
              تاريخ التسليم: {new Date(report.submittedAt).toLocaleDateString('ar-EG')}
            </p>
          </div>
        </div>

        {/* Score & Evaluation Big Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          <div className="sm:col-span-2 bg-gradient-to-l from-[#03243F] via-[#063154] to-[#02936C] rounded-3xl p-6 text-white flex items-center justify-between shadow-xl">
            <div className="space-y-1">
              <p className="text-xs font-bold text-emerald-200">الدرجة المحققة في الاختبار</p>
              <div className="text-4xl font-black font-mono">
                {report.score} <span className="text-xl font-normal text-slate-300">/ {report.totalDegree}</span>
              </div>
              <p className="text-xs text-slate-200 font-bold">
                النسبة المئوية العامة: <strong className="text-white font-black">{percentage}%</strong>
              </p>
            </div>

            <div className="text-center bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
              <span className="text-2xl block mb-1">
                {percentage >= 85 ? '🌟' : percentage >= 70 ? '👏' : percentage >= 50 ? '👍' : '⚠️'}
              </span>
              <span className="text-xs font-black text-white block">
                {percentage >= 85 ? 'ممتاز وتفوق' : percentage >= 70 ? 'جيد جداً' : percentage >= 50 ? 'ناجح' : 'يحتاج متابعة'}
              </span>
            </div>
          </div>

          {/* سلوك الطالب ومكافحة الغش */}
          <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200 flex flex-col justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 mb-2">مؤشر الالتزام ومكافحة الغش</p>
              {report.tabSwitchCount === 0 ? (
                <div className="flex items-center gap-2 text-[#02936C] text-xs font-black">
                  <ShieldCheck className="w-5 h-5 text-[#02936C]" />
                  <span>التزام تام (لم يغادر شاشة الامتحان)</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-700 text-xs font-bold">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <span>تم رصد مغادرة الصفحة {report.tabSwitchCount} مرات</span>
                </div>
              )}
            </div>
            <p className="text-[10px] text-slate-400 mt-3 leading-relaxed font-bold">
              يرصد نظام كَنترول أي محاولة لتبديل النافذة لضمان النزاهة والعدالة بين الطلاب.
            </p>
          </div>

        </div>

      </div>

      {/* شهادة التقدير والتفوق (تظهر فقط لو الطالب جايب 85% فما فوق) */}
      {isHonored && (
        <div className="bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 border-4 border-amber-300 rounded-[2.5rem] p-8 text-center space-y-4 shadow-xl relative overflow-hidden print:border-4 print:shadow-none">
          <div className="absolute top-2 left-2 text-amber-200 text-6xl opacity-30 select-none">★</div>
          <div className="absolute bottom-2 right-2 text-amber-200 text-6xl opacity-30 select-none">★</div>
          
          <div className="w-14 h-14 bg-amber-400 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md shadow-amber-400/40">
            <Award className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-xl font-black text-amber-950 font-serif">شهادة تقدير وتفوق أكاديمي</h2>
            <p className="text-xs text-amber-800 font-bold mt-1">تمنحها إدارة المنصة بالتعاون مع المعلم لتفوق الطالب واجتهاده</p>
          </div>

          <div className="max-w-lg mx-auto py-3 text-xs sm:text-sm text-slate-800 leading-relaxed font-bold">
            يشهد الأستاذ / <strong className="text-amber-900 font-extrabold">{report.teacherName}</strong> وإدارة <strong className="text-amber-900">{report.centerName || 'السنتر'}</strong> بأن الطالب النجيب:
            <div className="text-xl sm:text-2xl font-black text-[#03243F] my-2 underline decoration-amber-400 decoration-2">
              {report.studentName}
            </div>
            قد اجتاز اختبار <strong className="text-[#03243F] font-black">{report.examTitle}</strong> بتفوق واقتدار بنسبة نجاح <strong className="text-amber-800 font-extrabold">{percentage}%</strong>.
          </div>

          <div className="flex items-center justify-between max-w-md mx-auto pt-4 border-t border-amber-200 text-[11px] text-amber-900 font-bold">
            <div>توقيع المعلم: {report.teacherName}</div>
            <div>ختم الاعتماد: منصة كَنترول (Kontrol) ✓</div>
          </div>
        </div>
      )}

      {/* تفاصيل الإجابات ومراجعة الأخطاء مع ولي الأمر */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs">
        <h3 className="text-sm font-black text-[#03243F] mb-1">مراجعة إجابات الأسئلة</h3>
        <p className="text-xs text-slate-400 font-bold mb-4">
          يمكنك مراجعة كل سؤال مع الطالب لمعرفة نقاط القوة والأسئلة التي تحتاج للمراجعة
        </p>

        <div className="space-y-3">
          {report.answers.map((ans) => (
            <div
              key={ans.questionIndex}
              className={`p-4 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                ans.isCorrect
                  ? 'bg-emerald-50/30 border-emerald-200'
                  : 'bg-red-50/30 border-red-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`w-7 h-7 rounded-full text-xs font-black flex items-center justify-center shrink-0 ${
                  ans.isCorrect ? 'bg-emerald-100 text-[#02936C]' : 'bg-red-100 text-red-800'
                }`}>
                  #{ans.questionIndex}
                </span>

                <div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="font-bold text-slate-700">إجابة الطالب: <strong className="text-[#03243F]">{ans.studentAnswer || 'فارغ'}</strong></span>
                    {!ans.isCorrect && (
                      <span className="text-[#02936C] font-black">
                        الصحيحة: <strong>{ans.correctAnswer}</strong>
                      </span>
                    )}
                  </div>
                  {ans.explanation && (
                    <p className="text-[11px] text-slate-500 mt-1 font-bold">
                      💡 {ans.explanation}
                    </p>
                  )}
                </div>
              </div>

              <div className="text-left shrink-0">
                <span className={`text-xs font-black px-2.5 py-1 rounded-xl ${
                  ans.isCorrect ? 'bg-emerald-100 text-[#02936C]' : 'bg-red-100 text-red-800'
                }`}>
                  {ans.isCorrect ? `+${ans.degreeEarned} درجة` : '0 درجة'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
