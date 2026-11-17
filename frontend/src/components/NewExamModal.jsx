import React, { useState, useEffect } from 'react';
import { 
  X, Upload, FileText, CheckCircle2, Share2, Plus, Minus, 
  HelpCircle, Calendar, Clock, AlertCircle, Sparkles, BookOpen, Trash2, Check, Edit3
} from 'lucide-react';
import { examsAPI } from '../services/api';
import { createExamShareWhatsAppLink } from '../utils/whatsapp';

export default function NewExamModal({ isOpen, onClose, groups = [], onExamCreated }) {
  // Step 1: الإعدادات والملف | Step 2: مفتاح الإجابة أو كتابة الأسئلة
  const [step, setStep] = useState(1);
  const [examNature, setExamNature] = useState('exam'); // 'exam' | 'homework'
  const [answerMethod, setAnswerMethod] = useState('ANSWER_SHEET'); // 'ANSWER_SHEET' | 'MCQ' | 'ESSAY'
  
  // Step 1 Fields
  const [selectedGroup, setSelectedGroup] = useState(groups[0]?.id || '');

  // مزامنة اختيار المجموعة فور وصول بيانات المجموعات من السيرفر
  useEffect(() => {
    if (groups && groups.length > 0 && !selectedGroup) {
      setSelectedGroup(groups[0].id);
    }
  }, [groups]);
  
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [durationMins, setDurationMins] = useState(30);
  const [deadlineDate, setDeadlineDate] = useState(new Date().toISOString().split('T')[0]);
  const [deadlineTime, setDeadlineTime] = useState('end_of_day');
  const [showAnswersSetting, setShowAnswersSetting] = useState('AFTER_DEADLINE');
  
  // Step 2 Fields - نمط ورقة الإجابة (بابل شيت سريع)
  const [questionCount, setQuestionCount] = useState(5);
  const [optionsRange, setOptionsRange] = useState('أ-د');
  const [rawKeyInput, setRawKeyInput] = useState('ب أ ب ج د');
  const [answersKey, setAnswersKey] = useState({
    1: 'ب',
    2: 'أ',
    3: 'ب',
    4: 'ج',
    5: 'د',
  });
  const [degrees, setDegrees] = useState({
    1: 1, 2: 1, 3: 1, 4: 1, 5: 1
  });

  // Step 2 Fields - نمط إدخال الأسئلة والخيارات يدوياً (بدون PDF)
  const [manualQuestions, setManualQuestions] = useState([
    {
      text: '',
      options: { 'أ': '', 'ب': '', 'ج': '', 'د': '' },
      correctAnswer: 'أ',
      degree: 1,
      explanation: ''
    }
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdExamResult, setCreatedExamResult] = useState(null);

  if (!isOpen) return null;

  // الحروف المتاحة
  const letters = ['أ', 'ب', 'ج', 'د'];

  // دالة ذكية لتعبئة المفتاح من النص السريع
  const handleAutoFillKey = () => {
    if (!rawKeyInput.trim()) return;
    const normalized = rawKeyInput
      .replace(/[0-9\-.:,،]/g, ' ')
      .replace(/[Aaا]/g, 'أ')
      .replace(/[Bb]/g, 'ب')
      .replace(/[Cc]/g, 'ج')
      .replace(/[Dd]/g, 'د');

    const matches = normalized.match(/[أبجد]/g);
    if (!matches || matches.length === 0) {
      alert('لم نتمكن من العثور على حروف صالحة. اكتب مثلاً: ب أ ب ج د');
      return;
    }

    const newKey = {};
    const newDegrees = {};
    matches.forEach((letter, idx) => {
      newKey[idx + 1] = letter;
      newDegrees[idx + 1] = degrees[idx + 1] || 1;
    });

    setQuestionCount(matches.length);
    setAnswersKey(newKey);
    setDegrees(newDegrees);
  };

  // تغيير عدد الأسئلة (بابل شيت)
  const changeQuestionCount = (delta) => {
    const newCount = Math.max(1, questionCount + delta);
    setQuestionCount(newCount);
    const newKey = { ...answersKey };
    const newDegrees = { ...degrees };
    for (let i = 1; i <= newCount; i++) {
      if (!newKey[i]) newKey[i] = 'أ';
      if (!newDegrees[i]) newDegrees[i] = 1;
    }
    setAnswersKey(newKey);
    setDegrees(newDegrees);
  };

  // اختيار حرف لسؤال معين (بابل شيت)
  const handleSelectOption = (qNum, letter) => {
    setAnswersKey(prev => ({ ...prev, [qNum]: letter }));
  };

  // دوال الأسئلة اليدوية (بدون PDF)
  const handleAddManualQuestion = () => {
    setManualQuestions(prev => [
      ...prev,
      {
        text: '',
        options: { 'أ': '', 'ب': '', 'ج': '', 'د': '' },
        correctAnswer: 'أ',
        degree: 1,
        explanation: ''
      }
    ]);
  };

  const handleRemoveManualQuestion = (index) => {
    if (manualQuestions.length <= 1) return;
    setManualQuestions(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdateManualQuestion = (index, field, value) => {
    setManualQuestions(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleUpdateManualOption = (qIndex, letter, val) => {
    setManualQuestions(prev => {
      const updated = [...prev];
      updated[qIndex] = {
        ...updated[qIndex],
        options: {
          ...updated[qIndex].options,
          [letter]: val
        }
      };
      return updated;
    });
  };

  // إرسال البيانات للباك إند
  const handlePublish = async (andShareWhatsApp = false) => {
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('type', answerMethod);
      formData.append('durationMins', durationMins);
      formData.append('showAnswers', showAnswersSetting);
      const groupToAssign = selectedGroup || groups[0]?.id;
      if (groupToAssign) {
        formData.append('groupIds', groupToAssign);
      }
      if (file) {
        formData.append('pdfFile', file);
      }

      let activeQCount = questionCount;

      if (answerMethod === 'MCQ') {
        // التحقق من تعبئة الأسئلة
        const emptyIndex = manualQuestions.findIndex(q => !q.text.trim());
        if (emptyIndex !== -1) {
          setError(`يرجى كتابة نص السؤال رقم (${emptyIndex + 1})`);
          setLoading(false);
          return;
        }

        formData.append('questionsData', JSON.stringify(manualQuestions));
        const keyString = manualQuestions.map(q => q.correctAnswer || 'أ').join(' ');
        formData.append('quickKey', keyString);
        activeQCount = manualQuestions.length;
      } else {
        // بناء نص مفتاح الحل السريع للبابل شيت
        const keyString = Array.from({ length: questionCount }, (_, i) => answersKey[i + 1] || 'أ').join(' ');
        formData.append('quickKey', keyString);
        activeQCount = questionCount;
      }

      const res = await examsAPI.create(formData);
      const newExam = res.data.exam;

      if (onExamCreated) onExamCreated(newExam);

      if (andShareWhatsApp) {
        const waLink = createExamShareWhatsAppLink(
          newExam.title,
          newExam.generalCode || 'DIRECT',
          newExam.durationMins,
          activeQCount
        );
        window.open(waLink, '_blank');
      }

      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'حدث خطأ أثناء حفظ الامتحان');
    } finally {
      setLoading(false);
    }
  };

  const totalDegreesCalculated = answerMethod === 'MCQ'
    ? manualQuestions.reduce((sum, q) => sum + (parseFloat(q.degree) || 1), 0)
    : Array.from({ length: questionCount }).reduce((sum, _, i) => sum + (degrees[i + 1] || 1), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto font-cairo text-right selection:bg-[#02936C] selection:text-white">
      <div className="bg-white rounded-[2rem] shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-100">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#02936C] flex items-center justify-center font-bold">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-black text-[#03243F]">
                {step === 1 
                  ? 'إنشاء اختبار أو واجب جديد' 
                  : answerMethod === 'MCQ' 
                    ? `${title || 'الاختبار'} | إدخال الأسئلة النصية`
                    : `${title || 'الاختبار'} | ورقة الإجابة ومفتاح الحل`}
              </h2>
              <p className="text-[11px] text-slate-400 font-bold">
                {step === 1 
                  ? 'الخطوة 1 من 2: الإعدادات وطريقة الإدخال' 
                  : answerMethod === 'MCQ'
                    ? 'الخطوة 2 من 2: كتابة نصوص الأسئلة والخيارات وتحديد الإجابة الصحيحة'
                    : 'الخطوة 2 من 2: مفتاح الحل وتوزيع الدرجات'}
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-right">
          
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {step === 1 ? (
            /* ==================== STEP 1: إعدادات الامتحان ==================== */
            <>
              {/* تبويب: امتحان / واجب */}
              <div className="flex items-center justify-center p-1 bg-slate-100 rounded-2xl max-w-xs mx-auto border border-slate-200/80">
                <button
                  type="button"
                  onClick={() => setExamNature('exam')}
                  className={`flex-1 py-2 text-xs font-black rounded-xl transition ${
                    examNature === 'exam'
                      ? 'bg-white text-[#03243F] shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  📖 امتحان
                </button>
                <button
                  type="button"
                  onClick={() => setExamNature('homework')}
                  className={`flex-1 py-2 text-xs font-black rounded-xl transition ${
                    examNature === 'homework'
                      ? 'bg-white text-[#03243F] shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  📝 واجب منزلي
                </button>
              </div>

              {/* طريقة الإجابة والإدخال */}
              <div>
                <label className="block text-xs font-black text-slate-700 mb-2">طريقة إدخال الأسئلة ونظام التصحيح</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  
                  {/* إدخال الأسئلة يدوياً بدون PDF (MCQ) */}
                  <div
                    onClick={() => setAnswerMethod('MCQ')}
                    className={`cursor-pointer rounded-2xl p-4 border-2 text-center transition relative ${
                      answerMethod === 'MCQ'
                        ? 'border-[#02936C] bg-emerald-50/40 text-[#03243F] shadow-xs ring-2 ring-[#02936C]/20'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <span className="absolute -top-2.5 right-3 bg-[#02936C] text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                      جديد ومرن
                    </span>
                    <div className="w-8 h-8 mx-auto mb-2 text-[#02936C] flex items-center justify-center bg-white rounded-xl border border-emerald-200 shadow-2xs text-base">
                      ✍️
                    </div>
                    <p className="text-xs font-black">كتابة الأسئلة يدوياً</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">بدون الحاجة لرفع PDF</p>
                  </div>

                  {/* ورقة إجابة (بابل شيت سريع) */}
                  <div
                    onClick={() => setAnswerMethod('ANSWER_SHEET')}
                    className={`cursor-pointer rounded-2xl p-4 border-2 text-center transition relative ${
                      answerMethod === 'ANSWER_SHEET'
                        ? 'border-[#02936C] bg-emerald-50/40 text-[#03243F] shadow-xs ring-2 ring-[#02936C]/20'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <span className="absolute -top-2.5 right-3 bg-[#03243F] text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                      الأسرع
                    </span>
                    <div className="w-8 h-8 mx-auto mb-2 text-[#03243F] flex items-center justify-center bg-white rounded-xl border border-slate-200 shadow-2xs text-base">
                      📋
                    </div>
                    <p className="text-xs font-black">بابل شيت ومفتاح الحل</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">برفع PDF أو كود سريع</p>
                  </div>

                  {/* مقالي */}
                  <div
                    onClick={() => setAnswerMethod('ESSAY')}
                    className={`cursor-pointer rounded-2xl p-4 border-2 text-center transition ${
                      answerMethod === 'ESSAY'
                        ? 'border-[#02936C] bg-emerald-50/40 text-[#03243F] ring-2 ring-[#02936C]/20'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <div className="w-8 h-8 mx-auto mb-2 text-slate-600 flex items-center justify-center bg-white rounded-xl border border-slate-200 text-base">
                      🤖
                    </div>
                    <p className="text-xs font-black">تصحيح مقالي بالـ AI</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">تقييم إجابات الطلاب</p>
                  </div>
                </div>

                {answerMethod === 'MCQ' ? (
                  <p className="text-[11px] text-emerald-800 font-bold mt-2.5 bg-emerald-50/80 p-3 rounded-2xl border border-emerald-200 leading-relaxed">
                    ✨ <strong>مميزات الإدخال اليدوي:</strong> تقدر تكتب الأسئلة والخيارات الأربعة (أ، ب، ج، د) بنفسك مباشرة من اللوحة وتحدد الإجابة الصحيحة بدون ما ترفع أي ملف أو صورة! وتظهر الأسئلة للطلاب على الشاشة منسقة ومرتبة.
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-500 font-bold mt-2.5 bg-slate-50 p-3 rounded-2xl border border-slate-200 leading-relaxed">
                    ✨ <strong>فكرة البابل شيت:</strong> ارفع ورقة الأسئلة PDF، وأدخل مفتاح الإجابة بسطر سريع (أ ب ج د). ممتاز للامتحانات الورقية الموزعة بالسنتر أو المصححة بالكاميرا.
                  </p>
                )}
              </div>

              {/* اختيار المجموعة */}
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5">المجموعة / الفصل المستهدف *</label>
                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-3 text-xs font-bold focus:border-[#02936C] focus:ring-2 focus:ring-[#02936C]/20 focus:outline-none bg-white"
                >
                  {groups.length === 0 && <option value="">لا توجد مجموعات حالياً (سيتم إنشاء كود عام)</option>}
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g._count?.students || 0} طالب)
                    </option>
                  ))}
                </select>
              </div>

              {/* عنوان الامتحان */}
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5">عنوان الاختبار *</label>
                <input
                  type="text"
                  placeholder="مثال: اختبار فيزياء - قانون أوم وتوصيل المقاومات"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-3 text-xs font-bold focus:border-[#02936C] focus:ring-2 focus:ring-[#02936C]/20 focus:outline-none"
                  required
                />
              </div>

              {/* رفع ملف ورقة الأسئلة PDF (اختياري تماماً في حالة MCQ) */}
              {answerMethod === 'MCQ' ? (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#02936C] flex items-center justify-center font-bold text-lg shrink-0">
                      📝
                    </div>
                    <div>
                      <p className="text-xs font-black text-[#03243F]">ملف PDF غير مطلوب لهذا النمط</p>
                      <p className="text-[10px] text-slate-500 font-bold">
                        ستكتب الأسئلة والخيارات والإجابات الصحيحة مباشرة في الخطوة القادمة.
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-black text-[#02936C] bg-white border border-emerald-200 px-3 py-1.5 rounded-xl shadow-2xs">
                    إدخال مباشر ✍️
                  </span>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-black text-slate-700">
                      ورقة الأسئلة (PDF أو صورة المذكرة)
                    </label>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                      اختياري إذا تم توزيع الامتحان ورقياً
                    </span>
                  </div>
                  {!file ? (
                    <label className="border-2 border-dashed border-slate-200 hover:border-[#02936C] rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition bg-slate-50/60 hover:bg-emerald-50/30">
                      <Upload className="w-8 h-8 text-[#02936C] mb-2" />
                      <span className="text-xs font-black text-[#03243F]">اضغط لاختيار ملف PDF أو صور</span>
                      <span className="text-[10px] text-slate-400 font-bold mt-1">بحد أقصى 10 ميجابايت للملف (اختياري)</span>
                      <input
                        type="file"
                        accept=".pdf,image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) setFile(e.target.files[0]);
                        }}
                      />
                    </label>
                  ) : (
                    <div className="flex items-center justify-between p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <FileText className="w-6 h-6 text-[#02936C]" />
                        <div>
                          <p className="text-xs font-black text-[#03243F]">{file.name}</p>
                          <p className="text-[10px] text-slate-500 font-bold">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFile(null)}
                        className="text-slate-400 hover:text-red-500 p-1 rounded-lg transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* موعد التسليم ومدة الامتحان */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">مدة الاختبار (بالدقائق)</label>
                  <input
                    type="number"
                    min="5"
                    max="180"
                    value={durationMins}
                    onChange={(e) => setDurationMins(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-3 text-xs font-bold focus:border-[#02936C] focus:ring-2 focus:ring-[#02936C]/20 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">تاريخ انتهاء الموعد</label>
                  <input
                    type="date"
                    value={deadlineDate}
                    onChange={(e) => setDeadlineDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-3 text-xs font-bold focus:border-[#02936C] focus:ring-2 focus:ring-[#02936C]/20 focus:outline-none bg-white"
                  />
                </div>
              </div>

              {/* إظهار الإجابات الصحيحة */}
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5">ظهور الإجابات الصحيحة للطلاب</label>
                <select
                  value={showAnswersSetting}
                  onChange={(e) => setShowAnswersSetting(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-3 text-xs font-bold focus:border-[#02936C] focus:ring-2 focus:ring-[#02936C]/20 focus:outline-none bg-white"
                >
                  <option value="AFTER_DEADLINE">عند انتهاء موعد الاختبار (تظهر النتيجة فوراً والإجابات لاحقاً لمنع الغش)</option>
                  <option value="INSTANT">فورياً بعد التسليم مباشرة مع شرح الذكاء الاصطناعي</option>
                  <option value="MANUAL">يدوياً بقرار من المعلم فقط</option>
                </select>
              </div>
            </>
          ) : (
            /* ==================== STEP 2: محرر الأسئلة ومفتاح الإجابة ==================== */
            answerMethod === 'MCQ' ? (
              /* نمط كتابة الأسئلة يدوياً (بدون PDF) */
              <div className="space-y-4">
                
                {/* شريط الإحصائيات وزر إضافة سؤال */}
                <div className="flex items-center justify-between p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl">
                  <div>
                    <h3 className="text-xs font-black text-[#03243F] flex items-center gap-1.5">
                      <span>إدخال الأسئلة النصية والخيارات يدوياً</span>
                      <span className="text-[#02936C] bg-white border border-emerald-200 px-2 py-0.5 rounded-lg text-[10px]">
                        {manualQuestions.length} سؤال
                      </span>
                    </h3>
                    <p className="text-[10px] text-emerald-800 font-bold mt-0.5">
                      أدخل نص السؤال والخيارات، واضغط على حرف الإجابة الصحيحة لتظليله بالأخضر ✅
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddManualQuestion}
                    className="bg-[#02936C] hover:bg-[#027d5c] text-white px-3.5 py-2 rounded-xl text-xs font-black shadow-xs transition flex items-center gap-1.5 hover:scale-105 active:scale-95 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة سؤال جديد</span>
                  </button>
                </div>

                {/* قائمة كروت الأسئلة */}
                <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
                  {manualQuestions.map((q, qIndex) => (
                    <div 
                      key={qIndex}
                      className="p-4 bg-white border-2 border-slate-200 hover:border-slate-300 rounded-2xl space-y-3 transition shadow-xs"
                    >
                      {/* رأس كارت السؤال */}
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-xl bg-[#03243F] text-white text-xs font-black inline-flex items-center justify-center">
                            #{qIndex + 1}
                          </span>
                          <span className="text-xs font-black text-slate-800">
                            السؤال رقم ({qIndex + 1})
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                            <span>الدرجة:</span>
                            <input
                              type="number"
                              min="0.5"
                              step="0.5"
                              value={q.degree}
                              onChange={(e) => handleUpdateManualQuestion(qIndex, 'degree', parseFloat(e.target.value) || 1)}
                              className="w-12 border border-slate-200 rounded-lg text-center py-1 text-[#03243F] text-xs font-black focus:ring-1 focus:ring-[#02936C] focus:border-[#02936C]"
                            />
                          </div>

                          {manualQuestions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveManualQuestion(qIndex)}
                              className="text-slate-400 hover:text-red-600 p-1 rounded-lg transition"
                              title="حذف هذا السؤال"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* حقل نص السؤال */}
                      <div>
                        <label className="block text-[11px] font-black text-slate-700 mb-1">
                          نص السؤال *
                        </label>
                        <textarea
                          rows={2}
                          value={q.text}
                          onChange={(e) => handleUpdateManualQuestion(qIndex, 'text', e.target.value)}
                          placeholder={`اكتب نص السؤال رقم (${qIndex + 1}) هنا... (مثال: ما هي وحدة قياس شدة التيار الكهربائي؟)`}
                          className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:border-[#02936C] focus:ring-2 focus:ring-[#02936C]/20 focus:outline-none"
                          required
                        />
                      </div>

                      {/* الخيارات الأربعة مع تحديد الإجابة الصحيحة */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-[11px] font-black text-slate-700">
                            الخيارات الأربعة (اضغط على الحرف لتحديده كإجابة صحيحة ✅):
                          </label>
                          <span className="text-[10px] font-black text-[#02936C] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            الإجابة الصحيحة المحددة: ({q.correctAnswer})
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {letters.map((letter) => {
                            const isCorrect = q.correctAnswer === letter;
                            return (
                              <div
                                key={letter}
                                className={`flex items-center gap-2 p-1.5 rounded-xl border transition ${
                                  isCorrect 
                                    ? 'border-[#02936C] bg-emerald-50/50 ring-1 ring-[#02936C]' 
                                    : 'border-slate-200 bg-slate-50/60'
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => handleUpdateManualQuestion(qIndex, 'correctAnswer', letter)}
                                  className={`w-7 h-7 rounded-lg text-xs font-black transition flex items-center justify-center shrink-0 ${
                                    isCorrect 
                                      ? 'bg-[#02936C] text-white shadow-xs' 
                                      : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-200'
                                  }`}
                                  title={`تعيين (${letter}) كإجابة صحيحة`}
                                >
                                  {isCorrect ? <Check className="w-3.5 h-3.5" /> : letter}
                                </button>

                                <input
                                  type="text"
                                  value={q.options[letter] || ''}
                                  onChange={(e) => handleUpdateManualOption(qIndex, letter, e.target.value)}
                                  placeholder={`نص الخيار (${letter})...`}
                                  className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#02936C]"
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* توضيح الإجابة (اختياري) */}
                      <div>
                        <input
                          type="text"
                          value={q.explanation}
                          onChange={(e) => handleUpdateManualQuestion(qIndex, 'explanation', e.target.value)}
                          placeholder="توضيح أو قانون حل السؤال (اختياري - يظهر للطالب عند مراجعة النتيجة)..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-[11px] font-bold text-slate-600 placeholder:text-slate-400 focus:outline-none focus:border-[#02936C]"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* زر إضافة سؤال إضافي بالأسفل */}
                <button
                  type="button"
                  onClick={handleAddManualQuestion}
                  className="w-full py-2.5 border-2 border-dashed border-slate-300 hover:border-[#02936C] text-slate-600 hover:text-[#02936C] rounded-2xl text-xs font-black transition flex items-center justify-center gap-1.5 bg-slate-50/50"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ أضف سؤالاً آخر للاختبار</span>
                </button>

                {/* كارت ملخص الدرجات */}
                <div className="p-3.5 bg-slate-100 rounded-2xl flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>{manualQuestions.length} سؤال • إجمالي الدرجات: {totalDegreesCalculated} درجة</span>
                  <span className="text-[#02936C] font-black">جاهز للنشر المباشر 🚀</span>
                </div>

              </div>
            ) : (
              /* نمط البابل شيت السريع (مع أو بدون PDF) */
              <>
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-900 flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-[#02936C] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-black text-[#03243F] mb-0.5">مفتاح إجابات البابل شيت السريع</p>
                    <p className="text-emerald-800 font-bold">حدد عدد الأسئلة واضغط على الحرف الصحيح لكل سؤال، أو استخدم الملء السريع لتجهيز الامتحان في ثوانٍ!</p>
                  </div>
                </div>

                {/* تحكم عدد الأسئلة */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <div>
                    <p className="text-xs font-black text-[#03243F]">إجمالي عدد الأسئلة</p>
                    <p className="text-[11px] text-slate-400 font-bold">نطاق الاختيارات: {optionsRange}</p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => changeQuestionCount(-1)}
                      className="w-8 h-8 rounded-xl bg-white border border-slate-300 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-100 transition"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-base font-black text-[#03243F] w-8 text-center">{questionCount}</span>
                    <button
                      type="button"
                      onClick={() => changeQuestionCount(1)}
                      className="w-8 h-8 rounded-xl bg-white border border-slate-300 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-100 transition"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => changeQuestionCount(5)}
                      className="text-xs font-black text-[#02936C] bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl hover:bg-emerald-100 transition mr-2"
                    >
                      +5 أسئلة
                    </button>
                  </div>
                </div>

                {/* الميزة السحرية: اكتب المفتاح كاملاً */}
                <div className="border border-emerald-200 bg-emerald-50/30 p-4 rounded-2xl space-y-2">
                  <label className="block text-xs font-black text-[#03243F]">التعبئة السريعة لمفتاح الحل</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={rawKeyInput}
                      onChange={(e) => setRawKeyInput(e.target.value)}
                      placeholder="مثال: ب أ ب ج د أو 1-أ 2-ب"
                      className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold font-mono focus:border-[#02936C] focus:ring-2 focus:ring-[#02936C]/20 focus:outline-none bg-white"
                    />
                    <button
                      type="button"
                      onClick={handleAutoFillKey}
                      className="bg-[#03243F] hover:bg-[#063154] text-white px-4 py-2 rounded-xl text-xs font-black transition shadow-xs shrink-0"
                    >
                      املأ المفتاح
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 font-bold">
                    يقوم النظام تلقائياً بتحديد الحروف وتوزيعها على الأسئلة بالترتيب.
                  </p>
                </div>

                {/* شبكة أزرار الاختيارات */}
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {Array.from({ length: questionCount }, (_, index) => {
                    const qNum = index + 1;
                    const currentAnswer = answersKey[qNum] || 'أ';

                    return (
                      <div
                        key={qNum}
                        className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-2xl hover:border-slate-300 transition"
                      >
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                          <span>الدرجة:</span>
                          <input
                            type="number"
                            min="0.5"
                            step="0.5"
                            value={degrees[qNum] || 1}
                            onChange={(e) => setDegrees(prev => ({ ...prev, [qNum]: parseFloat(e.target.value) || 1 }))}
                            className="w-12 border border-slate-200 rounded-lg text-center py-1 text-[#03243F] text-xs font-black focus:ring-1 focus:ring-[#02936C] focus:border-[#02936C]"
                          />
                        </div>

                        <div className="flex items-center gap-3">
                          {/* أزرار الحروف أ ب ج د */}
                          <div className="flex items-center gap-1.5">
                            {letters.map((letter) => {
                              const isSelected = currentAnswer === letter;
                              return (
                                <button
                                  key={letter}
                                  type="button"
                                  onClick={() => handleSelectOption(qNum, letter)}
                                  className={`w-8 h-8 rounded-full text-xs font-black transition-all flex items-center justify-center ${
                                    isSelected
                                      ? 'bg-[#02936C] text-white shadow-md shadow-[#02936C]/30 scale-105'
                                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                  }`}
                                >
                                  {letter}
                                </button>
                              );
                            })}
                          </div>
                          <span className="w-6 text-center text-xs font-black text-[#03243F] mr-2">
                            #{qNum}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* كارت ملخص الدرجات */}
                <div className="p-3.5 bg-slate-100 rounded-2xl flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>{questionCount} سؤال • المجموع: {totalDegreesCalculated} درجة</span>
                  <span className="text-[#02936C] font-black">جاهز للنشر 🚀</span>
                </div>
              </>
            )
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
          {step === 1 ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-xs font-black text-slate-600 hover:text-slate-800 rounded-xl transition"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={!title}
                onClick={() => {
                  if (!title) {
                    alert('يرجى إدخال عنوان الاختبار');
                    return;
                  }
                  setStep(2);
                }}
                className="bg-[#02936C] hover:bg-[#027d5c] disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-xs font-black shadow-md shadow-[#02936C]/20 transition flex items-center gap-1.5"
              >
                <span>{answerMethod === 'MCQ' ? 'التالي: كتابة الأسئلة والخيارات' : 'التالي: مفتاح الإجابة'}</span>
                <span>←</span>
              </button>
            </>
          ) : (
            <div className="w-full flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2.5 text-xs font-black text-slate-600 hover:bg-slate-200 rounded-xl transition"
              >
                رجوع
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handlePublish(false)}
                className="flex-1 bg-[#03243F] hover:bg-[#063154] text-white py-2.5 rounded-xl text-xs font-black transition shadow-xs"
              >
                {loading ? 'جاري الحفظ...' : 'نشر الاختبار الآن'}
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handlePublish(true)}
                className="flex-1 bg-[#02936C] hover:bg-[#027d5c] text-white py-2.5 rounded-xl text-xs font-black transition shadow-md shadow-[#02936C]/20 flex items-center justify-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{loading ? 'جاري النشر...' : 'نشر ومشاركة واتساب'}</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}