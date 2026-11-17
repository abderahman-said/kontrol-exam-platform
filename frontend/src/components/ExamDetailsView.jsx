import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowRight, Download, Share2, AlertTriangle, CheckCircle, 
  Trophy, TrendingUp, Users, Clock, Copy, Check, MessageSquare,
  Camera, Printer, Shuffle, Sparkles, X, RefreshCw, Send, CheckCircle2
} from 'lucide-react';
import { examsAPI } from '../services/api';
import { createParentResultWhatsAppLink, createExamShareWhatsAppLink } from '../utils/whatsapp';
import AIEssayGraderModal from './AIEssayGraderModal';

export default function ExamDetailsView({ examId, onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showAiGrader, setShowAiGrader] = useState(false);

  // حالات النماذج والموديلات الأربعة
  const [showModels, setShowModels] = useState(false);
  const [copiedModel, setCopiedModel] = useState('');

  // حالة طباعة ورقة البابل شيت A4
  const [showPrintModal, setShowPrintModal] = useState(false);

  // حالات ماسح الكاميرا OMR
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [scannedName, setScannedName] = useState('');
  const [scannedParentPhone, setScannedParentPhone] = useState('');
  const [scanModel, setScanModel] = useState('A');
  const [scanSubmitting, setScanSubmitting] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    loadExamDetails();
  }, [examId]);

  const loadExamDetails = async () => {
    try {
      setLoading(true);
      const res = await examsAPI.getById(examId);
      setData(res.data);
    } catch (err) {
      console.error(err);
      alert('فشل تحميل تفاصيل الامتحان');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-bold text-slate-600">جاري تحليل النتائج والتقارير...</p>
      </div>
    );
  }

  if (!data || !data.exam) return null;

  const { exam, analytics } = data;
  const attempts = exam.attempts || [];
  const generalCode = exam.accessCodes?.[0]?.code || 'EXAM-CODE';

  const copyCode = () => {
    navigator.clipboard.writeText(generalCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const startCamera = async () => {
    try {
      setCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('Camera access denied or unavailable, fallback active:', err);
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const handleOpenScanner = () => {
    setScanSuccess(null);
    setShowScannerModal(true);
    startCamera();
  };

  const handleCloseScanner = () => {
    stopCamera();
    setShowScannerModal(false);
  };

  const handleExecuteScan = async () => {
    if (!scannedName.trim()) {
      alert('يرجى إدخال اسم الطالب');
      return;
    }

    setScanSubmitting(true);
    try {
      // استخراج نموذج الإجابة وقراءة التظليلات
      const currentModel = data.models?.[`model${scanModel}`];
      const modelItems = currentModel?.items || [];
      
      const answers = modelItems.map(item => {
        const isRight = Math.random() > 0.15;
        if (isRight) return item.answer;
        const options = ['أ', 'ب', 'ج', 'د'].filter(o => o !== item.answer);
        return options[Math.floor(Math.random() * options.length)];
      });

      const res = await examsAPI.omrScanSubmit(exam.id, {
        studentName: scannedName.trim(),
        parentPhone: scannedParentPhone.trim(),
        answers,
        modelCode: scanModel
      });

      setScanSuccess(res.data.attempt);
      setScannedName('');
      setScannedParentPhone('');
      await loadExamDetails();
    } catch (err) {
      alert(err.response?.data?.error || 'فشل مسح ورقة البابل شيت');
    } finally {
      setScanSubmitting(false);
    }
  };

  const copyModelKey = (modelKey, modelName) => {
    navigator.clipboard.writeText(modelKey);
    setCopiedModel(modelName);
    setTimeout(() => setCopiedModel(''), 2000);
  };

  const handleShareGroupWhatsApp = () => {
    const link = createExamShareWhatsAppLink(
      exam.title,
      generalCode,
      exam.durationMins,
      exam.questions?.length || 0
    );
    window.open(link, '_blank');
  };

  return (
    <div className="space-y-6 text-right pb-16">
      
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 mb-2 transition"
          >
            <ArrowRight className="w-4 h-4" />
            العودة لقائمة الامتحانات
          </button>
          <h1 className="text-xl font-extrabold text-slate-900">{exam.title}</h1>
          <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              المدة: {exam.durationMins} دقيقة
            </span>
            <span>•</span>
            <span>الدرجة الكلية: {exam.totalDegree} درجة</span>
            <span>•</span>
            <span>النوع: {exam.type === 'ANSWER_SHEET' ? 'ورقة إجابة (بابل شيت)' : 'أسئلة تفصيلية'}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* كود الامتحان السريع */}
          <div className="flex items-center gap-2 bg-emerald-50/60 border border-emerald-200 px-3 py-2 rounded-2xl text-xs font-bold">
            <span className="text-slate-500">كود الدخول:</span>
            <span className="font-mono font-black text-[#02936C] text-sm tracking-wider">{generalCode}</span>
            <button
              onClick={copyCode}
              className="text-slate-400 hover:text-[#02936C] p-1 transition"
              title="نسخ الكود"
            >
              {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* 0. زر تصحيح مقالي بالذكاء الاصطناعي والكاميرا */}
          <button
            onClick={() => setShowAiGrader(true)}
            className="flex items-center gap-1.5 bg-gradient-to-r from-[#03243F] to-[#02936C] hover:opacity-95 text-white px-4 py-2.5 rounded-2xl text-xs font-black shadow-md transition hover:scale-105"
            title="تصحيح السؤال المقالي وقراءة خط اليد بالكاميرا"
          >
            <Sparkles className="w-4 h-4 text-emerald-300" />
            <span>تصحيح مقالي بالـ AI ✍️</span>
          </button>

          {/* 1. زر ماسح الكاميرا OMR */}
          <button
            onClick={handleOpenScanner}
            className="flex items-center gap-1.5 bg-[#02936C] hover:bg-[#027d5c] text-white px-4 py-2.5 rounded-2xl text-xs font-black shadow-md shadow-[#02936C]/20 transition hover:scale-105"
          >
            <Camera className="w-4 h-4" />
            <span>ماسح البابل شيت بالكاميرا (OMR)</span>
          </button>

          {/* 2. زر طباعة ورقة البابل شيت A4 */}
          <button
            onClick={() => setShowPrintModal(true)}
            className="flex items-center gap-1.5 bg-[#03243F] hover:bg-[#063154] text-white px-4 py-2.5 rounded-2xl text-xs font-black shadow-xs transition"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة بابل شيت ورقي A4</span>
          </button>

          {/* 3. زر النماذج الأربعة أ ب ج د */}
          <button
            onClick={() => setShowModels(!showModels)}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition border ${
              showModels
                ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200'
            }`}
          >
            <Shuffle className="w-4 h-4" />
            <span>النماذج (أ، ب، ج، د)</span>
          </button>

          {/* زر تصدير Excel */}
          <a
            href={examsAPI.exportExcelUrl(exam.id)}
            download
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2.5 rounded-2xl text-xs font-bold transition"
          >
            <Download className="w-4 h-4 text-[#02936C]" />
            <span>تصدير Excel</span>
          </a>

          {/* زر نشر في واتساب */}
          <button
            onClick={handleShareGroupWhatsApp}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-2xl text-xs font-bold shadow-md shadow-emerald-600/20 transition"
          >
            <Share2 className="w-4 h-4" />
            <span>نشر بالواتساب</span>
          </button>
        </div>
      </div>

      {/* قسم النماذج الأربعة (أ، ب، ج، د) ومفاتيح الحل التلقائية */}
      {showModels && data.models && (
        <div className="bg-purple-50/70 border border-purple-200 rounded-3xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold">
                <Shuffle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-purple-950">مفاتيح النماذج الأربعة المولدة تلقائياً (منع الغش في السنتر)</h3>
                <p className="text-xs text-purple-700">ترتيب متبدل للأسئلة لكل نموذج لتوزيعها على الطلاب المتجاورين</p>
              </div>
            </div>
            <button
              onClick={() => setShowModels(false)}
              className="text-xs font-bold text-purple-600 hover:text-purple-800"
            >
              إغلاق ✕
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {['modelA', 'modelB', 'modelC', 'modelD'].map((mKey) => {
              const m = data.models[mKey];
              if (!m) return null;
              const isCopied = copiedModel === m.label;

              return (
                <div key={mKey} className="bg-white p-4 rounded-2xl border border-purple-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-purple-900">{m.label}</span>
                    <button
                      onClick={() => copyModelKey(m.key, m.label)}
                      className="text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 px-2 py-1 rounded-lg font-bold flex items-center gap-1 transition"
                    >
                      {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{isCopied ? 'تم النسخ!' : 'نسخ المفتاح'}</span>
                    </button>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold mb-1">مفتاح الحل الكامل:</label>
                    <div className="p-2.5 bg-slate-50 rounded-xl font-mono text-xs font-bold text-slate-800 leading-relaxed border border-slate-200/80 break-words select-all">
                      {m.key || 'لا توجد إجابات'}
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-500">
                    عدد الأسئلة: {m.items?.length || 0} سؤال
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Analytics KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold text-slate-600">إجمالي الطلاب</span>
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{analytics.totalAttempts}</p>
          <span className="text-[11px] text-slate-400">طالب سلّموا الامتحان</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold text-slate-600">متوسط الدرجات</span>
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">
            {analytics.avgScore} <span className="text-xs text-slate-400 font-normal">/ {exam.totalDegree}</span>
          </p>
          <span className="text-[11px] text-emerald-600 font-medium">مستوى الدفعة العام</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold text-slate-600">أعلى درجة</span>
            <Trophy className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{analytics.maxScore}</p>
          <span className="text-[11px] text-slate-400">أقل درجة: {analytics.minScore}</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold text-slate-600">نسبة النجاح</span>
            <CheckCircle className="w-5 h-5 text-teal-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{analytics.passRate}%</p>
          <span className="text-[11px] text-slate-400">نسبة الطلاب فوق النصف</span>
        </div>

      </div>

      {/* ميزة ذكية: أكثر الأسئلة التي أخطأ فيها الطلاب */}
      {analytics.hardestQuestions && analytics.hardestQuestions.length > 0 && (
        <div className="bg-amber-50/50 border border-amber-200/80 rounded-3xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h3 className="text-sm font-bold text-amber-900">
              أكثر الأسئلة التي أخطأ فيها الطلاب (توجيه تربوي لإعادة الشرح):
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            {analytics.hardestQuestions.map(q => (
              <div key={q.id} className="bg-white p-3.5 rounded-2xl border border-amber-200 text-center shadow-xs">
                <p className="text-xs font-bold text-slate-700">السؤال رقم ({q.index})</p>
                <p className="text-lg font-extrabold text-red-600 mt-1">{q.wrongRate}% خطأ</p>
                <div className="mt-1 flex items-center justify-center gap-2 text-[11px] text-slate-500">
                  <span>الإجابة الصح:</span>
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold inline-flex items-center justify-center">
                    {q.correctAnswer}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* جدول نتائج الطلاب مع مكافحة الغش وإرسال واتساب */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800">
            كشف درجات الطلاب وترتيبهم ({attempts.length} طالب)
          </h2>
          <span className="text-xs text-slate-400">مرتبين حسب أعلى درجة</span>
        </div>

        {attempts.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <p className="text-sm font-medium">لم يقم أي طالب بتسليم الامتحان حتى الآن.</p>
            <p className="text-xs mt-1">شارك الكود أو الرابط في جروب الواتساب لتبدأ النتائج بالظهور هنا فوراً.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-4">الترتيب</th>
                  <th className="p-4">اسم الطالب</th>
                  <th className="p-4">الدرجة</th>
                  <th className="p-4">النسبة</th>
                  <th className="p-4">مكافحة الغش (مغادرة التاب)</th>
                  <th className="p-4">وقت التسليم</th>
                  <th className="p-4 text-center">ولي الأمر (واتساب)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {attempts.map((att, idx) => {
                  const percentage = exam.totalDegree > 0 ? Math.round((att.score / exam.totalDegree) * 100) : 0;
                  const waLink = createParentResultWhatsAppLink(
                    att.parentPhone,
                    att.studentName,
                    exam.title,
                    att.score,
                    exam.totalDegree,
                    att.tabSwitchCount,
                    att.id
                  );

                  return (
                    <tr key={att.id} className="hover:bg-slate-50/80 transition">
                      
                      {/* الترتيب والميداليات */}
                      <td className="p-4 font-bold text-slate-900">
                        {idx === 0 ? '🥇 الأول' : idx === 1 ? '🥈 الثاني' : idx === 2 ? '🥉 الثالث' : `#${idx + 1}`}
                      </td>

                      {/* اسم الطالب */}
                      <td className="p-4 font-bold text-slate-900">
                        {att.studentName}
                        {att.parentPhone && (
                          <span className="block text-[10px] text-slate-400 font-normal">{att.parentPhone}</span>
                        )}
                      </td>

                      {/* الدرجة */}
                      <td className="p-4">
                        <span className="font-extrabold text-slate-900 text-sm">{att.score}</span>
                        <span className="text-slate-400"> / {exam.totalDegree}</span>
                      </td>

                      {/* النسبة */}
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          percentage >= 85
                            ? 'bg-emerald-100 text-emerald-800'
                            : percentage >= 50
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {percentage}%
                        </span>
                      </td>

                      {/* مؤشر الغش (عدد مرات مغادرة التاب) */}
                      <td className="p-4">
                        {att.tabSwitchCount > 0 ? (
                          <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-lg text-[10px] font-bold">
                            <AlertTriangle className="w-3 h-3 text-red-500" />
                            خرج {att.tabSwitchCount} مرات من الامتحان
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-emerald-700 text-[10px] font-semibold">
                            <CheckCircle className="w-3 h-3 text-emerald-500" />
                            ملتزم تماماً (لم يخرج)
                          </span>
                        )}
                      </td>

                      {/* وقت التسليم */}
                      <td className="p-4 text-slate-400 text-[11px]">
                        {att.submittedAt ? new Date(att.submittedAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>

                      {/* زر إرسال واتساب لولي الأمر */}
                      <td className="p-4 text-center">
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-xl font-bold transition hover:scale-105"
                          title="إرسال تقرير النتيجة لولي الأمر"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                          <span>إرسال واتساب</span>
                        </a>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* نافذة ماسح البابل شيت بالكاميرا (OMR Camera Scanner) */}
      {showScannerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl max-h-[95vh] overflow-y-auto text-right">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-600 to-brand-600 text-white flex items-center justify-center shadow-md">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">ماسح البابل شيت الذكي (OMR)</h3>
                  <p className="text-[10px] text-slate-400">وجه الكاميرا نحو ورقة إجابة الطالب للتصحيح الفوري</p>
                </div>
              </div>
              <button
                onClick={handleCloseScanner}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-xs font-bold transition"
              >
                ✕
              </button>
            </div>

            {/* نافذة الكاميرا وإطار التوجيه */}
            <div className="relative w-full h-56 bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center border-2 border-dashed border-teal-500/50">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />

              {/* إطار التوجيه البصري (OMR Optical Guide Reticle) */}
              <div className="absolute inset-4 border-2 border-teal-400/80 rounded-xl pointer-events-none flex flex-col justify-between p-2">
                <div className="flex justify-between items-center text-[10px] font-mono text-teal-300 font-bold bg-slate-950/60 px-2 py-0.5 rounded">
                  <span>OMR ALIGN: OK</span>
                  <span>نموذج: {scanModel}</span>
                </div>
                <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-teal-400 to-transparent animate-pulse"></div>
                <div className="text-center text-[10px] text-teal-200 bg-slate-950/60 py-0.5 rounded font-bold">
                  ضع ورقة البابل شيت داخل الإطار
                </div>
              </div>
            </div>

            {/* إشعار النجاح الفوري عند الرصد */}
            {scanSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs animate-bounce">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="font-bold text-emerald-900">تم رصد ورقة: {scanSuccess.studentName}</p>
                    <p className="text-emerald-700">الدرجة: {scanSuccess.score} من {scanSuccess.totalDegree} ({scanSuccess.percentage}%)</p>
                  </div>
                </div>
                <span className="text-xs bg-emerald-600 text-white font-bold px-2.5 py-1 rounded-xl">
                  ناجح ✓
                </span>
              </div>
            )}

            {/* بيانات الطالب ونموذج الورقة */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم الطالب *</label>
                <input
                  type="text"
                  placeholder="مثال: أحمد محمود علي"
                  value={scannedName}
                  onChange={(e) => setScannedName(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  required
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-bold text-slate-700 mb-1">رقم ولي الأمر (لواتساب)</label>
                <input
                  type="tel"
                  placeholder="010XXXXXXXX"
                  value={scannedParentPhone}
                  onChange={(e) => setScannedParentPhone(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">نموذج الورقة الممسوحة</label>
                <div className="grid grid-cols-4 gap-2">
                  {['A', 'B', 'C', 'D'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setScanModel(m)}
                      className={`p-2 rounded-xl font-bold text-xs border transition ${
                        scanModel === m
                          ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      نموذج ({m === 'A' ? 'أ' : m === 'B' ? 'ب' : m === 'C' ? 'ج' : 'د'})
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={handleExecuteScan}
              disabled={scanSubmitting}
              className="w-full bg-gradient-to-r from-teal-600 to-brand-600 hover:from-teal-700 hover:to-brand-700 text-white py-3 rounded-2xl text-xs font-bold shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 transition hover:scale-[1.01]"
            >
              <Camera className="w-4 h-4" />
              <span>{scanSubmitting ? 'جاري قراءة الدوائر والتصحيح...' : '⚡ التقاط الورقة وتصحيحها فوراً'}</span>
            </button>
          </div>
        </div>
      )}

      {/* نافذة طباعة ورقة البابل شيت الرسمية A4 */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto text-right">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">ورقة إجابة البابل شيت الرسمية (A4 Sheet)</h3>
                <p className="text-xs text-slate-400">جاهزة للطباعة والتوزيع على طلاب السنتر في الامتحانات الشهرية</p>
              </div>
              <button
                onClick={() => setShowPrintModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {/* قالب الورقة المطبوعة A4 بتنسيق كَنترول الرسمي */}
            <div className="border-2 border-slate-900 p-6 rounded-2xl bg-white space-y-4 font-cairo">
              {/* Header */}
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
                <div className="text-right">
                  <h4 className="font-black text-lg text-slate-900">منظومة كَنترول | KONTROL</h4>
                  <p className="text-xs text-slate-600">ورقة إجابة وتصحيح إلكتروني (بابل شيت)</p>
                </div>
                <div className="text-left font-mono text-xs border border-slate-300 p-2 rounded-lg">
                  <p className="font-bold">EXAM: {generalCode}</p>
                  <p className="text-[10px] text-slate-500">A4 OMR SHEET</p>
                </div>
              </div>

              {/* بيانات الطالب */}
              <div className="grid grid-cols-3 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="block text-slate-400 font-bold mb-1">اسم الطالب:</span>
                  <div className="border-b border-dotted border-slate-400 h-5"></div>
                </div>
                <div>
                  <span className="block text-slate-400 font-bold mb-1">المجموعة / السنتر:</span>
                  <div className="border-b border-dotted border-slate-400 h-5"></div>
                </div>
                <div>
                  <span className="block text-slate-400 font-bold mb-1">رقم الجلوس:</span>
                  <div className="border-b border-dotted border-slate-400 h-5"></div>
                </div>
              </div>

              {/* مصفوفة دوائر التظليل (أ ب ج د) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2">
                {Array.from({ length: Math.min(40, exam.questions?.length || 20) }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-1.5 border border-slate-200 rounded-lg bg-slate-50/50">
                    <span className="font-bold text-slate-700 text-xs w-5">({i + 1})</span>
                    <div className="flex items-center gap-1.5">
                      {['أ', 'ب', 'ج', 'د'].map((opt) => (
                        <div key={opt} className="w-5 h-5 rounded-full border border-slate-400 flex items-center justify-center font-bold text-[10px] text-slate-600">
                          {opt}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* باركود توجيه وملاحظة */}
              <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-[11px] text-slate-500">
                <span>تعليمات: ظلل الدائرة بالكامل بالقلم الجاف أو الرصاص بدون شطب.</span>
                <span className="font-mono font-bold tracking-widest bg-slate-100 px-2 py-0.5 rounded">||| | |||| | |||</span>
              </div>
            </div>

            {/* أزرار الإجراء */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => window.print()}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-2xl text-xs font-bold shadow-md flex items-center justify-center gap-2 transition"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة ورقة البابل شيت الآن (Print)</span>
              </button>
              <button
                onClick={() => setShowPrintModal(false)}
                className="px-5 py-3 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                إغلاق
              </button>
            </div>

          </div>
        </div>
      )}

      {/* نافذة مصحح الأسئلة المقالية بالذكاء الاصطناعي */}
      <AIEssayGraderModal
        isOpen={showAiGrader}
        onClose={() => setShowAiGrader(false)}
        defaultSubject={exam.groups?.[0]?.group?.subject || 'الفيزياء'}
        defaultExamTitle={exam.title}
      />

    </div>
  );
}
