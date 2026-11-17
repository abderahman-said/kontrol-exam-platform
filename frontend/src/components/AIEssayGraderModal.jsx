import React, { useState, useRef } from 'react';
import { 
  X, Camera, Upload, Sparkles, CheckCircle2, AlertTriangle, 
  Share2, Award, FileText, Check, Copy, RefreshCw, PenTool, BookOpen
} from 'lucide-react';
import { examsAPI } from '../services/api';
import Logo from './Logo';

export default function AIEssayGraderModal({ isOpen, onClose, defaultSubject = 'الفيزياء', defaultExamTitle = '' }) {
  const [subject, setSubject] = useState(defaultSubject || 'الفيزياء');
  const [studentName, setStudentName] = useState('أحمد محمد إبراهيم');
  const [parentPhone, setParentPhone] = useState('010XXXXXXXX');
  const [questionText, setQuestionText] = useState('علل: يفضل استخدام المحولات الرافعة للجهد عند محطات توليد الطاقة الكهربائية لنقلها لمسافات بعيدة؟');
  const [modelAnswer, setModelAnswer] = useState('لأن رفع الجهد يخفض شدة التيار المنقول في الأسلاك (وفقاً للعلاقة P = V × I)، وبالتالي يقل الفقد في الطاقة الكهربائية على شكل حرارة في الأسلاك (P_lost = I^2 × R)، مما يرفع كفاءة نقل الطاقة.');
  const [maxDegree, setMaxDegree] = useState(5);
  
  // الصورة
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  // حالة المعالجة والنتيجة
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [adjustedScore, setAdjustedScore] = useState(null);
  const [copiedWA, setCopiedWA] = useState(false);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  if (!isOpen) return null;

  // اختيار ملف من الجهاز
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // تعبئة نموذج تجريبي جاهز
  const handleLoadSample = () => {
    setSubject('الفيزياء');
    setQuestionText('علل: يفضل استخدام المحولات الرافعة للجهد عند محطات توليد الطاقة الكهربائية لنقلها لمسافات بعيدة؟');
    setModelAnswer('لأن رفع الجهد يخفض شدة التيار المنقول في الأسلاك (وفقاً للعلاقة P = V × I)، وبالتالي يقل الفقد في الطاقة الكهربائية على شكل حرارة في الأسلاك (P_lost = I^2 × R)، مما يرفع كفاءة نقل الطاقة.');
    setMaxDegree(5);
    setStudentName('عمر خالد مصطفى');
  };

  // إرسال الصورة والبيانات للذكاء الاصطناعي للتصحيح وقراءة خط اليد
  const handleGrade = async () => {
    if (!imagePreview) {
      alert('يرجى التقاط صورة ورقة الطالب أو رفعها من المعرض أولاً');
      return;
    }
    if (!questionText.trim()) {
      alert('يرجى كتابة نص السؤال المقالي');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await examsAPI.aiGradeEssay({
        questionText,
        modelAnswer,
        maxDegree: parseFloat(maxDegree) || 5,
        subject,
        studentName,
        imageBase64: imagePreview
      });

      if (res.data.success && res.data.grading) {
        setResult(res.data.grading);
        setAdjustedScore(res.data.grading.score);
      } else {
        throw new Error('لم يتم استرجاع نتيجة التصحيح');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || err.message || 'حدث خطأ أثناء التصحيح بالذكاء الاصطناعي');
    } finally {
      setLoading(false);
    }
  };

  // مشاركة التقييم عبر واتساب لولي الأمر
  const handleShareWhatsApp = () => {
    if (!result) return;
    const finalScore = adjustedScore !== null ? adjustedScore : result.score;
    const waText = `*تقرير تصحيح السؤال المقالي - منصة كَنترول 🎓*
--------------------------------
👨‍🎓 *اسم الطالب:* ${studentName}
📘 *المادة:* ${subject}
📝 *السؤال:* ${questionText}

📊 *درجة الطالب:* ${finalScore} من ${result.maxDegree} (${Math.round((finalScore / result.maxDegree) * 100)}%)
🏆 *التقييم العام:* ${result.verdict}

🔍 *ما تم قراءته من خط يد الطالب:*
"${result.extractedText}"

✅ *نقاط القوة:*
${result.strengths?.map(s => '• ' + s).join('\n') || 'إجابة طيبة وموفقة'}

⚠️ *الملاحظات والتوجيه:*
${result.missedPoints?.map(m => '• ' + m).join('\n') || 'لا توجد أخطاء'}

💡 *نصيحة المعلم والـ AI:*
${result.constructiveFeedback || ''}
--------------------------------
تم التصحيح والتدقيق عبر الذكاء الاصطناعي لمنصة كَنترول (Kontrol) ✓`;

    const phoneClean = (parentPhone || '').replace(/[^0-9]/g, '');
    const waUrl = phoneClean && phoneClean.length >= 10
      ? `https://wa.me/2${phoneClean}?text=${encodeURIComponent(waText)}`
      : `https://wa.me/?text=${encodeURIComponent(waText)}`;

    window.open(waUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto font-cairo text-right selection:bg-[#02936C] selection:text-white">
      <div className="bg-white rounded-[2rem] shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#02936C] flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-[#03243F] flex items-center gap-2">
                <span>مصحح الأسئلة المقالية بالذكاء الاصطناعي</span>
                <span className="text-[10px] bg-emerald-100 text-[#02936C] font-black px-2 py-0.5 rounded-full border border-emerald-300">
                  Google Gemini Vision
                </span>
              </h2>
              <p className="text-[11px] text-slate-400 font-bold">
                التقط صورة ورقة الطالب بكاميرا الموبايل ودع الـ AI يقرأ خط اليد ويقيم المفاهيم تلقائياً
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!result ? (
            /* ==================== مرحلة إعداد السؤال والتقاط الصورة ==================== */
            <div className="space-y-4">
              
              {/* شريط الإعدادات السريعة (المادة، الطالب، الدرجة) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">المادة الدراسية</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-bold focus:border-[#02936C] focus:ring-2 focus:ring-[#02936C]/20 focus:outline-none"
                    placeholder="مثال: الفيزياء"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">اسم الطالب (اختياري)</label>
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-bold focus:border-[#02936C] focus:ring-2 focus:ring-[#02936C]/20 focus:outline-none"
                    placeholder="اسم الطالب"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">الدرجة الكلية للسؤال</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={maxDegree}
                    onChange={(e) => setMaxDegree(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-black focus:border-[#02936C] focus:ring-2 focus:ring-[#02936C]/20 focus:outline-none text-center"
                  />
                </div>
              </div>

              {/* نص السؤال المقالي */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-black text-slate-700">نص السؤال المقالي *</label>
                  <button
                    type="button"
                    onClick={handleLoadSample}
                    className="text-[11px] text-[#02936C] font-black hover:underline"
                  >
                    + تحميل مثال تجريبي جاهز
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="مثال: علل / اشرح / قارن بين..."
                  className="w-full border border-slate-200 rounded-xl p-3 text-xs font-bold focus:border-[#02936C] focus:ring-2 focus:ring-[#02936C]/20 focus:outline-none leading-relaxed"
                />
              </div>

              {/* نموذج الإجابة أو معايير التصحيح */}
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  نموذج الإجابة أو الكلمات المفتاحية المطلوبة من الطالب
                </label>
                <textarea
                  rows={2}
                  value={modelAnswer}
                  onChange={(e) => setModelAnswer(e.target.value)}
                  placeholder="اكتب الإجابة النموذجية أو النقاط التي يجب أن يذكرها الطالب لنيل الدرجة كاملة..."
                  className="w-full border border-slate-200 rounded-xl p-3 text-xs font-bold focus:border-[#02936C] focus:ring-2 focus:ring-[#02936C]/20 focus:outline-none leading-relaxed"
                />
              </div>

              {/* قسم تصوير أو رفع ورقة الطالب */}
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5">
                  صورة إجابة الطالب (بخط اليد أو مطبوعة) *
                </label>

                {!imagePreview ? (
                  <div className="grid grid-cols-2 gap-3">
                    {/* زر الكاميرا المباشرة */}
                    <label className="border-2 border-dashed border-slate-200 hover:border-[#02936C] rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition bg-slate-50/70 hover:bg-emerald-50/30 group">
                      <Camera className="w-8 h-8 text-[#02936C] mb-2 group-hover:scale-110 transition" />
                      <span className="text-xs font-black text-[#03243F]">التقاط بالكاميرا 📷</span>
                      <span className="text-[10px] text-slate-400 font-bold mt-1">تصوير الورقة مباشرة</span>
                      <input
                        ref={cameraInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </label>

                    {/* زر رفع صورة من المعرض */}
                    <label className="border-2 border-dashed border-slate-200 hover:border-[#02936C] rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition bg-slate-50/70 hover:bg-emerald-50/30 group">
                      <Upload className="w-8 h-8 text-[#02936C] mb-2 group-hover:scale-110 transition" />
                      <span className="text-xs font-black text-[#03243F]">رفع صورة من المعرض 📁</span>
                      <span className="text-[10px] text-slate-400 font-bold mt-1">JPG أو PNG</span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </label>
                  </div>
                ) : (
                  <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-300 bg-slate-100 p-2 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={imagePreview}
                        alt="Student paper"
                        className="w-16 h-16 object-cover rounded-xl border border-slate-200 shadow-2xs"
                      />
                      <div>
                        <p className="text-xs font-black text-[#03243F]">تم التقاط ورقة الإجابة بنجاح ✓</p>
                        <p className="text-[10px] text-slate-400 font-bold">جاهزة للقراءة والتحليل بواسطة Google Gemini</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                      }}
                      className="text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-xl transition"
                    >
                      إعادة الالتقاط
                    </button>
                  </div>
                )}
              </div>

            </div>
          ) : (
            /* ==================== عرض نتيجة التصحيح بالـ AI ==================== */
            <div className="space-y-4 animate-in fade-in zoom-in-95">
              
              {/* كارت الدرجة الكبيرة والتقييم */}
              <div className="bg-gradient-to-l from-[#03243F] via-[#063154] to-[#02936C] p-6 rounded-3xl text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
                <div>
                  <span className="text-[10px] font-black bg-white/20 text-emerald-200 px-3 py-1 rounded-full border border-white/20 inline-block mb-1">
                    {result.verdict}
                  </span>
                  <h3 className="text-xl font-black">نتيجة تصحيح السؤال المقالي</h3>
                  <p className="text-xs text-slate-200 mt-0.5">
                    الطالب: <strong className="text-white">{studentName}</strong> • {subject}
                  </p>
                </div>

                <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-center shrink-0 min-w-[170px] space-y-1">
                  <p className="text-xs text-emerald-200 font-bold">الدرجة المقدرة بالـ AI</p>
                  <div className="text-3xl font-black font-mono">
                    {adjustedScore !== null ? adjustedScore : result.score} <span className="text-lg font-normal text-slate-300">/ {result.maxDegree}</span>
                  </div>
                  
                  {/* أزرار تعديل سريع للمعلم */}
                  <div className="flex items-center justify-center gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setAdjustedScore(prev => Math.max(0, (prev !== null ? prev : result.score) - 0.5))}
                      className="w-6 h-6 rounded-lg bg-white/20 hover:bg-white/30 text-white font-bold text-xs flex items-center justify-center"
                      title="خصم نصف درجة"
                    >
                      -
                    </button>
                    <span className="text-[10px] text-slate-300">تعديل</span>
                    <button
                      type="button"
                      onClick={() => setAdjustedScore(prev => Math.min(result.maxDegree, (prev !== null ? prev : result.score) + 0.5))}
                      className="w-6 h-6 rounded-lg bg-white/20 hover:bg-white/30 text-white font-bold text-xs flex items-center justify-center"
                      title="إضافة نصف درجة"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* 1. النص المقروء من خط يد الطالب */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                <p className="text-xs font-black text-[#03243F] flex items-center gap-1.5">
                  <PenTool className="w-3.5 h-3.5 text-[#02936C]" />
                  <span>النص المستخرج من خط يد الطالب (OCR Transcription):</span>
                </p>
                <p className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200 leading-relaxed font-mono font-medium">
                  "{result.extractedText}"
                </p>
              </div>

              {/* 2. نقاط القوة التي ذكرها الطالب */}
              {result.strengths && result.strengths.length > 0 && (
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-1.5">
                  <p className="text-xs font-black text-[#02936C] flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#02936C]" />
                    <span>نقاط القوة والمفاهيم الصحيحة التي ذكرها الطالب:</span>
                  </p>
                  <ul className="space-y-1 text-xs text-slate-700 font-bold">
                    {result.strengths.map((s, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-[#02936C]">✓</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 3. النقاط الناقصة أو الملاحظات */}
              {result.missedPoints && result.missedPoints.length > 0 && (
                <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-1.5">
                  <p className="text-xs font-black text-amber-800 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>النقاط أو التفاصيل التي غفل عنها الطالب:</span>
                  </p>
                  <ul className="space-y-1 text-xs text-slate-700 font-bold">
                    {result.missedPoints.map((m, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-amber-600">•</span>
                        <span>{m}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 4. نصيحة وتوجيه المعلم والـ AI */}
              {result.constructiveFeedback && (
                <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-2xl space-y-1">
                  <p className="text-xs font-black text-blue-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>التوجيه التربوي المخصص للطالب:</span>
                  </p>
                  <p className="text-xs text-slate-700 leading-relaxed font-bold">
                    {result.constructiveFeedback}
                  </p>
                </div>
              )}

              {/* أزرار الإجراءات بعد التصحيح */}
              <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="w-full sm:flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-2xl text-xs font-black shadow-md shadow-emerald-500/20 transition flex items-center justify-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  <span>إرسال تقرير المقالي لولي الأمر على واتساب 📲</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setResult(null);
                    setImageFile(null);
                    setImagePreview(null);
                    setAdjustedScore(null);
                  }}
                  className="w-full sm:w-auto bg-[#03243F] hover:bg-[#063154] text-white px-5 py-3 rounded-2xl text-xs font-black transition flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-4 h-4 text-[#02936C]" />
                  <span>تصحيح ورقة طالب آخر 📄</span>
                </button>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        {!result && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-black text-slate-600 hover:text-slate-800 rounded-xl transition"
            >
              إلغاء
            </button>

            <button
              type="button"
              disabled={loading || !imagePreview}
              onClick={handleGrade}
              className="bg-[#02936C] hover:bg-[#027d5c] disabled:opacity-50 text-white px-7 py-3 rounded-2xl text-xs font-black shadow-md shadow-[#02936C]/20 transition flex items-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Google Gemini يقرأ خط يد الطالب ويصحح...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>بدء التصحيح بالذكاء الاصطناعي الآن 🚀</span>
                </>
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
