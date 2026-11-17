import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, Check, CheckCircle2, Plus, Minus, Trash2, 
  Upload, FileText, X, AlertCircle, Share2, Sparkles, 
  BookOpen, Clock, Calendar, ShieldCheck, HelpCircle, Copy, ExternalLink, Users, Award
} from 'lucide-react';
import Logo from '../components/Logo';
import { examsAPI, groupsAPI } from '../services/api';
import { createExamShareWhatsAppLink } from '../utils/whatsapp';

export default function NewExamPage() {
  const navigate = useNavigate();

  // الخطوة الحالية: 1 = الإعدادات | 2 = محرر الأسئلة | 3 = تم النشر والمشاركة
  const [step, setStep] = useState(1);
  
  // المستوى الأول: طبيعة الاختبار (امتحان رسمي أم واجب منزلي)
  const [examNature, setExamNature] = useState('exam'); // 'exam' | 'homework'

  // المستوى الثاني: طريقة إدخال الأسئلة ونظام التصحيح
  const [answerMethod, setAnswerMethod] = useState('MCQ'); // 'MCQ' | 'ANSWER_SHEET' | 'ESSAY'

  // بيانات المعلم والمجموعات
  const [teacher, setTeacher] = useState(null);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');

  // حقول الخطوة 1
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [durationMins, setDurationMins] = useState(30);
  const [deadlineDate, setDeadlineDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAnswersSetting, setShowAnswersSetting] = useState('AFTER_DEADLINE');

  // حقول الخطوة 2 - نمط كتابة الأسئلة يدوياً (MCQ)
  const [manualQuestions, setManualQuestions] = useState([
    {
      text: '',
      options: { 'أ': '', 'ب': '', 'ج': '', 'د': '' },
      correctAnswer: 'أ',
      degree: 1,
      explanation: ''
    }
  ]);

  // حقول الخطوة 2 - نمط بابل شيت ومفتاح الحل السريع (ANSWER_SHEET)
  const [questionCount, setQuestionCount] = useState(10);
  const [rawKeyInput, setRawKeyInput] = useState('أ ب ج د أ ب ج د أ ب');
  const [answersKey, setAnswersKey] = useState({
    1: 'أ', 2: 'ب', 3: 'ج', 4: 'د', 5: 'أ',
    6: 'ب', 7: 'ج', 8: 'د', 9: 'أ', 10: 'ب'
  });
  const [degrees, setDegrees] = useState({
    1: 1, 2: 1, 3: 1, 4: 1, 5: 1,
    6: 1, 7: 1, 8: 1, 9: 1, 10: 1
  });

  // حقول الخطوة 2 - نمط تصحيح المقالي بالذكاء الاصطناعي (ESSAY)
  const [essayQuestions, setEssayQuestions] = useState([
    {
      text: '',
      modelAnswer: '',
      degree: 2,
      rubric: ''
    }
  ]);

  // حالات التحميل والأخطاء والنشر
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdExam, setCreatedExam] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // حروف الاختيارات
  const letters = ['أ', 'ب', 'ج', 'د'];

  useEffect(() => {
    const token = localStorage.getItem('teacher_token');
    const userStr = localStorage.getItem('teacher_user');

    if (!token) {
      navigate('/teacher/login');
      return;
    }

    if (userStr) {
      try { setTeacher(JSON.parse(userStr)); } catch (e) {}
    }

    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const res = await groupsAPI.getAll();
      const loadedGroups = res.data.groups || [];
      setGroups(loadedGroups);
      if (loadedGroups.length > 0) {
        setSelectedGroup(loadedGroups[0].id);
      }
    } catch (err) {
      console.error('Failed to load groups:', err);
    }
  };

  // تبديل طبيعة الاختبار وضبط القيم المقترحة تلقائياً
  const handleNatureChange = (nature) => {
    setExamNature(nature);
    if (nature === 'homework') {
      setDurationMins(90);
      setShowAnswersSetting('INSTANT');
      if (!title) setTitle('واجب منزلي وتدريب');
    } else {
      setDurationMins(30);
      setShowAnswersSetting('AFTER_DEADLINE');
      if (title === 'واجب منزلي وتدريب') setTitle('');
    }
  };

  // ==========================================
  // دوال نمط الأسئلة اليدوية (MCQ)
  // ==========================================
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

  // ==========================================
  // دوال نمط البابل شيت السريع (ANSWER_SHEET)
  // ==========================================
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

  const handleSelectOption = (qNum, letter) => {
    setAnswersKey(prev => ({ ...prev, [qNum]: letter }));
  };

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
      alert('لم يتم العثور على حروف صالحة. اكتب مثلاً: أ ب ج د أ ب');
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

  // ==========================================
  // دوال نمط الأسئلة المقالية بالـ AI (ESSAY)
  // ==========================================
  const handleAddEssayQuestion = () => {
    setEssayQuestions(prev => [
      ...prev,
      {
        text: '',
        modelAnswer: '',
        degree: 2,
        rubric: ''
      }
    ]);
  };

  const handleRemoveEssayQuestion = (index) => {
    if (essayQuestions.length <= 1) return;
    setEssayQuestions(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdateEssayQuestion = (index, field, value) => {
    setEssayQuestions(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // ==========================================
  // الانتقال للخطوة 2 والتحقق من المدخلات
  // ==========================================
  const handleProceedToStep2 = (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('يرجى إدخال عنوان الاختبار أو الواجب');
      return;
    }

    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ==========================================
  // إرسال البيانات ونشر الاختبار
  // ==========================================
  const handlePublish = async (andShareWhatsApp = false) => {
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('type', answerMethod);
      formData.append('durationMins', durationMins);
      formData.append('showAnswers', showAnswersSetting);

      const groupToAssign = selectedGroup || (groups[0]?.id || '');
      if (groupToAssign) {
        formData.append('groupIds', groupToAssign);
      }

      if (file && (answerMethod === 'ANSWER_SHEET' || answerMethod === 'ESSAY')) {
        formData.append('pdfFile', file);
      }

      let activeQCount = 0;

      if (answerMethod === 'MCQ') {
        const emptyIndex = manualQuestions.findIndex(q => !q.text.trim());
        if (emptyIndex !== -1) {
          setError(`يرجى كتابة نص السؤال رقم (${emptyIndex + 1}) قبل النشر`);
          setLoading(false);
          return;
        }

        formData.append('questionsData', JSON.stringify(manualQuestions));
        const keyString = manualQuestions.map(q => q.correctAnswer || 'أ').join(' ');
        formData.append('quickKey', keyString);
        activeQCount = manualQuestions.length;
      } else if (answerMethod === 'ESSAY') {
        const emptyIndex = essayQuestions.findIndex(q => !q.text.trim());
        if (emptyIndex !== -1) {
          setError(`يرجى كتابة نص السؤال المقالي رقم (${emptyIndex + 1}) قبل النشر`);
          setLoading(false);
          return;
        }

        const essayData = essayQuestions.map(q => ({
          text: q.text.trim(),
          modelAnswer: q.modelAnswer.trim(),
          degree: q.degree,
          rubric: q.rubric.trim()
        }));

        formData.append('questionsData', JSON.stringify(essayData));
        activeQCount = essayQuestions.length;
      } else {
        // ANSWER_SHEET
        const keyString = Array.from({ length: questionCount }, (_, i) => answersKey[i + 1] || 'أ').join(' ');
        formData.append('quickKey', keyString);
        activeQCount = questionCount;
      }

      const res = await examsAPI.create(formData);
      const newExam = res.data.exam;

      setCreatedExam({
        ...newExam,
        questionCount: activeQCount
      });

      setStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });

      if (andShareWhatsApp) {
        const waLink = createExamShareWhatsAppLink(
          newExam.title,
          newExam.generalCode || 'DIRECT',
          newExam.durationMins,
          activeQCount
        );
        window.open(waLink, '_blank');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'حدث خطأ أثناء حفظ ونشر الاختبار');
    } finally {
      setLoading(false);
    }
  };

  // حساب مجموع الدرجات بناءً على النمط النشط فقط
  const totalDegreesCalculated = answerMethod === 'MCQ'
    ? manualQuestions.reduce((sum, q) => sum + (parseFloat(q.degree) || 1), 0)
    : answerMethod === 'ESSAY'
      ? essayQuestions.reduce((sum, q) => sum + (parseFloat(q.degree) || 2), 0)
      : Array.from({ length: questionCount }).reduce((sum, _, i) => sum + (parseFloat(degrees[i + 1]) || 1), 0);

  const activeQuestionsTotalCount = answerMethod === 'MCQ'
    ? manualQuestions.length
    : answerMethod === 'ESSAY'
      ? essayQuestions.length
      : questionCount;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-cairo text-right selection:bg-[#02936C] selection:text-white pb-20">
      
      {/* ========================================================
          الهيدر العلوي المطور للصفحة
      ======================================================== */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/teacher/dashboard')}
              className="flex items-center gap-1.5 text-xs font-black text-slate-600 hover:text-[#02936C] bg-slate-50 hover:bg-emerald-50 border border-slate-200/80 hover:border-emerald-200 px-3 py-1.5 rounded-xl transition"
            >
              <ArrowRight className="w-4 h-4 text-[#02936C]" />
              <span>العودة للوحة التحكم</span>
            </button>

            <span className="text-slate-300 hidden sm:inline">|</span>

            <div className="hidden sm:flex items-center gap-2">
              <Logo size="xs" />
              <span className="text-xs font-black text-[#03243F]">
                إنشاء اختبار أو واجب جديد
              </span>
            </div>
          </div>

          {/* Stepper علوي أنيق */}
          <div className="flex items-center gap-2 text-xs font-black">
            <span className={`px-3 py-1 rounded-xl transition ${
              step === 1 ? 'bg-[#03243F] text-white shadow-xs' : 'bg-slate-100 text-slate-500'
            }`}>
              1. الإعدادات
            </span>
            <span className="text-slate-300">←</span>
            <span className={`px-3 py-1 rounded-xl transition ${
              step === 2 ? 'bg-[#03243F] text-white shadow-xs' : 'bg-slate-100 text-slate-500'
            }`}>
              2. محرر الأسئلة
            </span>
            <span className="text-slate-300">←</span>
            <span className={`px-3 py-1 rounded-xl transition ${
              step === 3 ? 'bg-[#02936C] text-white shadow-xs' : 'bg-slate-100 text-slate-500'
            }`}>
              3. النشر
            </span>
          </div>

        </div>
      </header>

      {/* ========================================================
          المحتوى الرئيسي
      ======================================================== */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 pt-6">
        
        {/* شريط التنبيهات والأخطاء */}
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-black flex items-center gap-2.5 shadow-xs">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* الخطوة 1: الإعدادات العامة وطريقة الاختبار */}
        {/* ========================================================================= */}
        {step === 1 && (
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-7 animate-in fade-in duration-200">
            
            {/* 1. المستوى الأول: طبيعة العمل (امتحان رسمي أم واجب منزلي) */}
            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-700">نوع التكليف التعليمي</label>
              <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/80 max-w-md">
                <button
                  type="button"
                  onClick={() => handleNatureChange('exam')}
                  className={`py-2.5 px-4 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 ${
                    examNature === 'exam'
                      ? 'bg-white text-[#03243F] shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <BookOpen className="w-4 h-4 text-[#02936C]" />
                  <span>📖 امتحان رسمي محدد بوقت</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleNatureChange('homework')}
                  className={`py-2.5 px-4 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 ${
                    examNature === 'homework'
                      ? 'bg-white text-[#03243F] shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Award className="w-4 h-4 text-purple-600" />
                  <span>📝 واجب منزلي وتدريب</span>
                </button>
              </div>

              {examNature === 'exam' ? (
                <p className="text-[11px] text-slate-500 font-bold pr-1">
                  💡 <strong>الامتحان الرسمي:</strong> مؤقت زمني دقيق، مراقبة مغادرة الصفحة لمنع الغش، وتظهر الإجابات بعد انتهاء موعد الامتحان.
                </p>
              ) : (
                <p className="text-[11px] text-purple-700 font-bold pr-1 bg-purple-50 p-2.5 rounded-xl border border-purple-200">
                  💡 <strong>الواجب المنزلي:</strong> وقت مريح بدون ضغط، تظهر شروحات الذكاء الاصطناعي والإجابات فور التسليم لدعم التعلم الذاتي للطالب.
                </p>
              )}
            </div>

            {/* 2. المستوى الثاني: طريقة إدخال الأسئلة ونظام التصحيح (3 خيارات مستقلة تماماً) */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-700">طريقة إدخال الأسئلة ونظام التصحيح *</label>
                <span className="text-[10px] text-slate-400 font-bold">اختر الطريقة الأنسب لامتحانك</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                
                {/* 1. كتابة الأسئلة يدوياً (MCQ) */}
                <div
                  onClick={() => setAnswerMethod('MCQ')}
                  className={`cursor-pointer rounded-2xl p-4.5 border-2 text-center transition relative ${
                    answerMethod === 'MCQ'
                      ? 'border-[#02936C] bg-emerald-50/40 text-[#03243F] shadow-xs ring-2 ring-[#02936C]/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'
                  }`}
                >
                  <span className="absolute -top-2.5 right-3 bg-[#02936C] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-2xs">
                    جديد ومرن ✍️
                  </span>
                  <div className="w-10 h-10 mx-auto mb-2.5 text-[#02936C] flex items-center justify-center bg-white rounded-2xl border border-emerald-200 shadow-2xs text-lg">
                    ✍️
                  </div>
                  <p className="text-xs font-black text-[#03243F]">كتابة الأسئلة يدوياً</p>
                  <p className="text-[10px] text-slate-400 mt-1 font-bold">بدون الحاجة لرفع PDF</p>
                </div>

                {/* 2. بابل شيت ومفتاح الحل (ANSWER_SHEET) */}
                <div
                  onClick={() => setAnswerMethod('ANSWER_SHEET')}
                  className={`cursor-pointer rounded-2xl p-4.5 border-2 text-center transition relative ${
                    answerMethod === 'ANSWER_SHEET'
                      ? 'border-[#02936C] bg-emerald-50/40 text-[#03243F] shadow-xs ring-2 ring-[#02936C]/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'
                  }`}
                >
                  <span className="absolute -top-2.5 right-3 bg-[#03243F] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-2xs">
                    الأسرع 📋
                  </span>
                  <div className="w-10 h-10 mx-auto mb-2.5 text-[#03243F] flex items-center justify-center bg-white rounded-2xl border border-slate-200 shadow-2xs text-lg">
                    📋
                  </div>
                  <p className="text-xs font-black text-[#03243F]">بابل شيت ومفتاح الحل</p>
                  <p className="text-[10px] text-slate-400 mt-1 font-bold">برفع PDF أو كود سريع</p>
                </div>

                {/* 3. تصحيح مقالي بالذكاء الاصطناعي (ESSAY) */}
                <div
                  onClick={() => setAnswerMethod('ESSAY')}
                  className={`cursor-pointer rounded-2xl p-4.5 border-2 text-center transition relative ${
                    answerMethod === 'ESSAY'
                      ? 'border-[#02936C] bg-emerald-50/40 text-[#03243F] shadow-xs ring-2 ring-[#02936C]/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'
                  }`}
                >
                  <span className="absolute -top-2.5 right-3 bg-purple-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-2xs">
                    ذكاء اصطناعي 🤖
                  </span>
                  <div className="w-10 h-10 mx-auto mb-2.5 text-purple-700 flex items-center justify-center bg-white rounded-2xl border border-purple-200 shadow-2xs text-lg">
                    🤖
                  </div>
                  <p className="text-xs font-black text-[#03243F]">تصحيح مقالي بالـ AI</p>
                  <p className="text-[10px] text-slate-400 mt-1 font-bold">وقراءة خط اليد بالكاميرا</p>
                </div>

              </div>

              {/* صندوق الشرح الخاص بالطريقة المختارة فقط لمنع أي تداخل */}
              {answerMethod === 'MCQ' && (
                <div className="p-3.5 bg-emerald-50/80 rounded-2xl border border-emerald-200 text-xs text-emerald-900 leading-relaxed font-bold">
                  ✨ <strong>نمط الإدخال اليدوي المباشر:</strong> ستكتب نصوص الأسئلة والخيارات الأربعة (أ، ب، ج، د) مباشرة في الخطوة القادمة، وتحدد الإجابة الصحيحة وشرح الحل. تظهر الأسئلة للطلاب على شاشتهم مرتبة ومنسقة بدون الحاجة لرفع أي ملف.
                </div>
              )}

              {answerMethod === 'ANSWER_SHEET' && (
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 leading-relaxed font-bold">
                  📋 <strong>نمط البابل شيت السريع:</strong> ممتاز للامتحانات المطبوعة ورقياً في السنتر أو المرفوعة كملف PDF. تدخل مفتاح الحل بسطر سريع بنقرة زر واحدة في ثوانٍ.
                </div>
              )}

              {answerMethod === 'ESSAY' && (
                <div className="p-3.5 bg-purple-50 rounded-2xl border border-purple-200 text-xs text-purple-900 leading-relaxed font-bold">
                  🤖 <strong>نمط التصحيح المقالي بالذكاء الاصطناعي:</strong> تكتب الأسئلة المقالية ونموذج الإجابة، وسيقوم الذكاء الاصطناعي بقراءة إجابات الطلاب (سواء كتبوها بالكيبورد أو صوروها بكاميرا الهاتف بخط يدهم) وتصحيحها وإعطائهم الدرجة والملاحظات فوراً.
                </div>
              )}
            </div>

            {/* 3. البيانات الأساسية للاختبار */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
              
              {/* المجموعة المستهدفة */}
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5">
                  المجموعة أو السنتر المستهدف *
                </label>
                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="w-full border-2 border-slate-200 rounded-2xl p-3 text-xs font-bold focus:border-[#02936C] focus:ring-2 focus:ring-[#02936C]/20 focus:outline-none bg-white"
                >
                  {groups.length === 0 && <option value="">لا توجد مجموعات حالياً (سيتم إنشاء كود عام)</option>}
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g._count?.students || 0} طالب مسجل)
                    </option>
                  ))}
                </select>
              </div>

              {/* عنوان الاختبار */}
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5">
                  عنوان الاختبار أو التكليف *
                </label>
                <input
                  type="text"
                  placeholder="مثال: اختبار فيزياء - الباب الأول: قانون أوم وتوصيل المقاومات"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border-2 border-slate-200 rounded-2xl p-3 text-xs font-bold text-[#03243F] focus:border-[#02936C] focus:ring-2 focus:ring-[#02936C]/20 focus:outline-none"
                  required
                />
              </div>

              {/* حقل رفع الملف: يظهر فقط في نمط البابل شيت أو المقالي، ويختفي تماماً في الإدخال اليدوي */}
              {answerMethod === 'MCQ' ? (
                <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">✍️</span>
                    <div>
                      <p className="text-xs font-black text-[#03243F]">ملف PDF غير مطلوب لهذا النمط</p>
                      <p className="text-[10px] text-slate-500 font-bold">
                        ستكتب الأسئلة والخيارات الأربعة مباشرة في الخطوة القادمة.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-[#02936C] bg-white border border-emerald-200 px-3 py-1 rounded-xl shadow-2xs">
                    محرر مباشر
                  </span>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-black text-slate-700">
                      ورقة الأسئلة (ملف PDF أو صورة المذكرة)
                    </label>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                      اختياري إذا كانت الأسئلة مطبوعة ورقياً بالسنتر
                    </span>
                  </div>

                  {!file ? (
                    <label className="border-2 border-dashed border-slate-200 hover:border-[#02936C] rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition bg-slate-50/60 hover:bg-emerald-50/30">
                      <Upload className="w-8 h-8 text-[#02936C] mb-2" />
                      <span className="text-xs font-black text-[#03243F]">اضغط هنا لاختيار ملف الأسئلة (PDF أو صورة)</span>
                      <span className="text-[10px] text-slate-400 font-bold mt-1">بحد أقصى 15 ميجابايت (اختياري)</span>
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
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-xl hover:bg-white transition"
                        title="إلغاء الملف"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* مدة الاختبار وتاريخ الانتهاء */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">
                    مدة الاختبار (بالدقائق)
                  </label>
                  <div className="space-y-2">
                    <input
                      type="number"
                      min="5"
                      max="300"
                      value={durationMins}
                      onChange={(e) => setDurationMins(parseInt(e.target.value) || 30)}
                      className="w-full border-2 border-slate-200 rounded-2xl p-3 text-xs font-black focus:border-[#02936C] focus:ring-2 focus:ring-[#02936C]/20 focus:outline-none"
                    />
                    <div className="flex items-center gap-1.5">
                      {[15, 30, 45, 60, 90].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setDurationMins(m)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition ${
                            durationMins === m 
                              ? 'bg-[#03243F] text-white border-[#03243F]' 
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {m} د
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">
                    تاريخ انتهاء موعد التسليم
                  </label>
                  <input
                    type="date"
                    value={deadlineDate}
                    onChange={(e) => setDeadlineDate(e.target.value)}
                    className="w-full border-2 border-slate-200 rounded-2xl p-3 text-xs font-black focus:border-[#02936C] focus:ring-2 focus:ring-[#02936C]/20 focus:outline-none bg-white"
                  />
                </div>
              </div>

              {/* سياسة إظهار الإجابات النموذجية */}
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5">
                  موعد ظهور الإجابات الصحيحة والشرح للطلاب
                </label>
                <select
                  value={showAnswersSetting}
                  onChange={(e) => setShowAnswersSetting(e.target.value)}
                  className="w-full border-2 border-slate-200 rounded-2xl p-3 text-xs font-bold focus:border-[#02936C] focus:ring-2 focus:ring-[#02936C]/20 focus:outline-none bg-white"
                >
                  <option value="AFTER_DEADLINE">عند انتهاء موعد الاختبار (تظهر النتيجة فوراً والإجابات لاحقاً لمنع الغش)</option>
                  <option value="INSTANT">فورياً بعد التسليم مباشرة (موصى به للواجبات والتدريبات الذاتية)</option>
                  <option value="MANUAL">يدوياً بقرار من المعلم فقط لاحقاً</option>
                </select>
              </div>

            </div>

            {/* أزرار الخطوة 1 */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => navigate('/teacher/dashboard')}
                className="px-5 py-3 text-xs font-black text-slate-500 hover:text-slate-800 rounded-2xl transition"
              >
                إلغاء والعودة
              </button>

              <button
                type="button"
                onClick={handleProceedToStep2}
                className="bg-[#02936C] hover:bg-[#027d5c] text-white px-8 py-3 rounded-2xl text-xs font-black shadow-md shadow-[#02936C]/20 transition flex items-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
              >
                <span>
                  {answerMethod === 'MCQ' 
                    ? 'التالي: كتابة الأسئلة والخيارات' 
                    : answerMethod === 'ESSAY' 
                      ? 'التالي: محرر الأسئلة المقالية' 
                      : 'التالي: مفتاح إجابات البابل شيت'}
                </span>
                <span>←</span>
              </button>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* الخطوة 2: محرر الأسئلة ومفتاح الحل (مفصولة بالكامل حسب النمط) */}
        {/* ========================================================================= */}
        {step === 2 && (
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in duration-200">
            
            {/* الشريط التعريفي أعلى المحرر */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/90">
              <div>
                <h2 className="text-sm font-black text-[#03243F] flex items-center gap-2">
                  <span>{title}</span>
                  <span className="text-[11px] font-black bg-emerald-100 text-[#02936C] px-2.5 py-0.5 rounded-full">
                    {answerMethod === 'MCQ' ? 'كتابة يدوية' : answerMethod === 'ESSAY' ? 'مقالي AI' : 'بابل شيت'}
                  </span>
                </h2>
                <p className="text-xs text-slate-500 font-bold mt-0.5">
                  إجمالي الأسئلة: <strong className="text-[#03243F]">{activeQuestionsTotalCount} سؤال</strong> • إجمالي الدرجات: <strong className="text-[#02936C]">{totalDegreesCalculated} درجة</strong>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-3.5 py-2 text-xs font-black text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition"
                >
                  تعديل الإعدادات
                </button>
              </div>
            </div>

            {/* ========================================================== */}
            {/* الحالة A: محرر الأسئلة النصية يدوياً (MCQ) */}
            {/* ========================================================== */}
            {answerMethod === 'MCQ' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-1">
                  <p className="text-xs font-black text-slate-700">
                    قائمة الأسئلة والخيارات (اضغط على الحرف لتحديده كإجابة صحيحة ✅):
                  </p>
                  <button
                    type="button"
                    onClick={handleAddManualQuestion}
                    className="bg-[#02936C] hover:bg-[#027d5c] text-white px-3.5 py-2 rounded-xl text-xs font-black shadow-xs transition flex items-center gap-1.5 hover:scale-105 active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة سؤال جديد</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {manualQuestions.map((q, qIndex) => (
                    <div 
                      key={qIndex}
                      className="p-5 bg-white border-2 border-slate-200 hover:border-slate-300 rounded-3xl space-y-4 transition shadow-xs"
                    >
                      {/* رأس كارت السؤال */}
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2.5">
                          <span className="w-8 h-8 rounded-xl bg-[#03243F] text-white text-xs font-black inline-flex items-center justify-center shadow-xs">
                            #{qIndex + 1}
                          </span>
                          <span className="text-sm font-black text-slate-800">
                            السؤال رقم ({qIndex + 1})
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                            <span>الدرجة:</span>
                            <input
                              type="number"
                              min="0.5"
                              step="0.5"
                              value={q.degree}
                              onChange={(e) => handleUpdateManualQuestion(qIndex, 'degree', parseFloat(e.target.value) || 1)}
                              className="w-12 bg-white border border-slate-200 rounded-lg text-center py-0.5 text-[#03243F] text-xs font-black focus:ring-1 focus:ring-[#02936C] focus:border-[#02936C]"
                            />
                          </div>

                          {manualQuestions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveManualQuestion(qIndex)}
                              className="text-slate-400 hover:text-rose-600 p-2 rounded-xl hover:bg-rose-50 transition"
                              title="حذف هذا السؤال"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* حقل نص السؤال */}
                      <div>
                        <label className="block text-xs font-black text-slate-700 mb-1.5">
                          نص السؤال *
                        </label>
                        <textarea
                          rows={2}
                          value={q.text}
                          onChange={(e) => handleUpdateManualQuestion(qIndex, 'text', e.target.value)}
                          placeholder={`اكتب نص السؤال رقم (${qIndex + 1}) هنا... (مثال: ما هي وحدة قياس شدة التيار الكهربائي في النظام الدولي؟)`}
                          className="w-full border-2 border-slate-200 rounded-2xl p-3 text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:border-[#02936C] focus:ring-2 focus:ring-[#02936C]/20 focus:outline-none"
                          required
                        />
                      </div>

                      {/* الخيارات الأربعة */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-black text-slate-700">
                            الخيارات الأربعة (اضغط على الزر الأخضر لتثبيت الإجابة الصحيحة):
                          </label>
                          <span className="text-[11px] font-black text-[#02936C] bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                            الإجابة الصحيحة المختارة: ({q.correctAnswer})
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {letters.map((letter) => {
                            const isCorrect = q.correctAnswer === letter;
                            return (
                              <div
                                key={letter}
                                className={`flex items-center gap-2 p-2 rounded-2xl border-2 transition ${
                                  isCorrect 
                                    ? 'border-[#02936C] bg-emerald-50/50 shadow-2xs' 
                                    : 'border-slate-200 bg-slate-50/60'
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => handleUpdateManualQuestion(qIndex, 'correctAnswer', letter)}
                                  className={`w-8 h-8 rounded-xl text-xs font-black transition flex items-center justify-center shrink-0 ${
                                    isCorrect 
                                      ? 'bg-[#02936C] text-white shadow-xs' 
                                      : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-200'
                                  }`}
                                  title={`تعيين (${letter}) كإجابة صحيحة`}
                                >
                                  {isCorrect ? <Check className="w-4 h-4" /> : letter}
                                </button>

                                <input
                                  type="text"
                                  value={q.options[letter] || ''}
                                  onChange={(e) => handleUpdateManualOption(qIndex, letter, e.target.value)}
                                  placeholder={`نص الخيار (${letter})...`}
                                  className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#02936C]"
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* توضيح الإجابة والقانون (اختياري) */}
                      <div>
                        <input
                          type="text"
                          value={q.explanation}
                          onChange={(e) => handleUpdateManualQuestion(qIndex, 'explanation', e.target.value)}
                          placeholder="توضيح الإجابة أو القانون المستخدم (اختياري - يظهر للطالب عند مراجعة النتيجة)..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-600 placeholder:text-slate-400 focus:outline-none focus:border-[#02936C]"
                        />
                      </div>

                    </div>
                  ))}
                </div>

                {/* زر إضافة سؤال عريض بالأسفل */}
                <button
                  type="button"
                  onClick={handleAddManualQuestion}
                  className="w-full py-3.5 border-2 border-dashed border-slate-300 hover:border-[#02936C] text-slate-600 hover:text-[#02936C] rounded-3xl text-xs font-black transition flex items-center justify-center gap-2 bg-slate-50/50 hover:bg-emerald-50/30"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ إضافة سؤال آخر للاختبار</span>
                </button>
              </div>
            )}

            {/* ========================================================== */}
            {/* الحالة B: محرر البابل شيت ومفتاح الحل السريع (ANSWER_SHEET) */}
            {/* ========================================================== */}
            {answerMethod === 'ANSWER_SHEET' && (
              <div className="space-y-5">
                
                {/* الملء السريع */}
                <div className="border border-emerald-200 bg-emerald-50/40 p-5 rounded-2xl space-y-2.5">
                  <label className="block text-xs font-black text-[#03243F]">
                    التعبئة السريعة لمفتاح الحل (الصق الحروف كاملة بنقرة زر واحدة)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={rawKeyInput}
                      onChange={(e) => setRawKeyInput(e.target.value)}
                      placeholder="مثال: أ ب ج د أ ب ج د أ ب أو 1-أ 2-ب"
                      className="flex-1 border-2 border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold focus:border-[#02936C] focus:ring-2 focus:ring-[#02936C]/20 focus:outline-none bg-white"
                    />
                    <button
                      type="button"
                      onClick={handleAutoFillKey}
                      className="bg-[#03243F] hover:bg-[#063154] text-white px-5 py-2.5 rounded-xl text-xs font-black transition shadow-xs shrink-0"
                    >
                      املأ المفتاح فوراً
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 font-bold">
                    يقوم النظام باستخراج الحروف وتوزيعها على الأسئلة وضبط عدد الأسئلة تلقائياً.
                  </p>
                </div>

                {/* تحكم عدد الأسئلة */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <div>
                    <p className="text-xs font-black text-[#03243F]">إجمالي عدد أسئلة البابل شيت</p>
                    <p className="text-[11px] text-slate-400 font-bold">نطاق الاختيارات لكل سؤال: (أ - د)</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => changeQuestionCount(-1)}
                      className="w-9 h-9 rounded-xl bg-white border border-slate-300 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-100 transition shadow-2xs"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-base font-black text-[#03243F] w-10 text-center">{questionCount}</span>
                    <button
                      type="button"
                      onClick={() => changeQuestionCount(1)}
                      className="w-9 h-9 rounded-xl bg-white border border-slate-300 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-100 transition shadow-2xs"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => changeQuestionCount(5)}
                      className="text-xs font-black text-[#02936C] bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl hover:bg-emerald-100 transition mr-2"
                    >
                      +5 أسئلة
                    </button>
                  </div>
                </div>

                {/* شبكة أزرار البابل شيت */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[50vh] overflow-y-auto pr-1">
                  {Array.from({ length: questionCount }, (_, index) => {
                    const qNum = index + 1;
                    const currentAnswer = answersKey[qNum] || 'أ';

                    return (
                      <div
                        key={qNum}
                        className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-2xl hover:border-slate-300 transition shadow-2xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-xl bg-[#03243F] text-white text-xs font-black flex items-center justify-center">
                            #{qNum}
                          </span>
                          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
                            <span>الدرجة:</span>
                            <input
                              type="number"
                              min="0.5"
                              step="0.5"
                              value={degrees[qNum] || 1}
                              onChange={(e) => setDegrees(prev => ({ ...prev, [qNum]: parseFloat(e.target.value) || 1 }))}
                              className="w-10 border border-slate-200 rounded-lg text-center py-0.5 text-xs font-black text-[#03243F]"
                            />
                          </div>
                        </div>

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
                      </div>
                    );
                  })}
                </div>

              </div>
            )}

            {/* ========================================================== */}
            {/* الحالة C: محرر الأسئلة المقالية بالـ AI (ESSAY) */}
            {/* ========================================================== */}
            {answerMethod === 'ESSAY' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-1">
                  <div>
                    <h3 className="text-xs font-black text-[#03243F] flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      <span>قائمة الأسئلة المقالية ونماذج التقييم الذكي</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 font-bold mt-0.5">
                      اكتب نص السؤال والإجابة النموذجية أو الكلمات المفتاحية ليقوم الـ AI بتصحيحها للطالب.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddEssayQuestion}
                    className="bg-purple-700 hover:bg-purple-800 text-white px-3.5 py-2 rounded-xl text-xs font-black shadow-xs transition flex items-center gap-1.5 hover:scale-105 active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة سؤال مقالي</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {essayQuestions.map((q, qIndex) => (
                    <div 
                      key={qIndex}
                      className="p-5 bg-white border-2 border-purple-100 hover:border-purple-300 rounded-3xl space-y-3.5 transition shadow-xs"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-purple-50">
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 rounded-xl bg-purple-700 text-white text-xs font-black inline-flex items-center justify-center shadow-xs">
                            #{qIndex + 1}
                          </span>
                          <span className="text-sm font-black text-[#03243F]">
                            سؤال مقالي رقم ({qIndex + 1})
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-purple-50/60 px-3 py-1 rounded-xl border border-purple-200">
                            <span>الدرجة:</span>
                            <input
                              type="number"
                              min="1"
                              step="0.5"
                              value={q.degree}
                              onChange={(e) => handleUpdateEssayQuestion(qIndex, 'degree', parseFloat(e.target.value) || 2)}
                              className="w-12 bg-white border border-purple-200 rounded-lg text-center py-0.5 text-purple-900 text-xs font-black"
                            />
                          </div>

                          {essayQuestions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveEssayQuestion(qIndex)}
                              className="text-slate-400 hover:text-rose-600 p-1.5 rounded-xl hover:bg-rose-50 transition"
                              title="حذف هذا السؤال"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-black text-slate-700 mb-1">
                          نص السؤال المقالي *
                        </label>
                        <textarea
                          rows={2}
                          value={q.text}
                          onChange={(e) => handleUpdateEssayQuestion(qIndex, 'text', e.target.value)}
                          placeholder={`اكتب نص السؤال المقالي رقم (${qIndex + 1}) هنا... (مثال: علل: لماذا يقل فرق الجهد بين طرفي البطارية بزيادة شدة التيار المار في الدائرة؟)`}
                          className="w-full border-2 border-slate-200 rounded-2xl p-3 text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:border-purple-600 focus:outline-none"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-black text-purple-950 mb-1">
                          نموذج الإجابة وعناصر التقييم للذكاء الاصطناعي (Model Answer / Key Points) *
                        </label>
                        <textarea
                          rows={2}
                          value={q.modelAnswer}
                          onChange={(e) => handleUpdateEssayQuestion(qIndex, 'modelAnswer', e.target.value)}
                          placeholder="اكتب العناصر والكلمات الأساسية التي يجب أن يذكرها الطالب للحصول على الدرجة كاملة..."
                          className="w-full border-2 border-purple-200 bg-purple-50/30 rounded-2xl p-3 text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:border-purple-600 focus:outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleAddEssayQuestion}
                  className="w-full py-3.5 border-2 border-dashed border-purple-200 hover:border-purple-600 text-purple-700 rounded-3xl text-xs font-black transition flex items-center justify-center gap-2 bg-purple-50/30"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ إضافة سؤال مقالي آخر</span>
                </button>
              </div>
            )}

            {/* أزرار نشر الاختبار بالأسفل */}
            <div className="pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full sm:w-auto px-6 py-3 text-xs font-black text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-2xl transition"
              >
                ← رجوع للإعدادات
              </button>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handlePublish(false)}
                  className="flex-1 sm:flex-initial bg-[#03243F] hover:bg-[#063154] text-white px-7 py-3 rounded-2xl text-xs font-black transition shadow-xs disabled:opacity-50"
                >
                  {loading ? 'جاري الحفظ والنشر...' : 'نشر الاختبار الآن 🚀'}
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handlePublish(true)}
                  className="flex-1 sm:flex-initial bg-[#02936C] hover:bg-[#027d5c] text-white px-7 py-3 rounded-2xl text-xs font-black transition shadow-md shadow-[#02936C]/20 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                >
                  <Share2 className="w-4 h-4" />
                  <span>{loading ? 'جاري النشر...' : 'نشر ومشاركة واتساب 📲'}</span>
                </button>
              </div>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* الخطوة 3: شاشة نجاح النشر ومشاركة الرابط والكود */}
        {/* ========================================================================= */}
        {step === 3 && createdExam && (
          <div className="bg-white rounded-3xl border border-slate-200/90 p-8 shadow-xs text-center space-y-6 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-emerald-100 text-[#02936C] rounded-3xl flex items-center justify-center mx-auto text-2xl shadow-sm">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>

            <div className="space-y-1">
              <h1 className="text-2xl font-black text-[#03243F]">
                تم نشر الاختبار بنجاح وبدء تفعيله! 🎉
              </h1>
              <p className="text-xs text-slate-500 font-bold">
                {createdExam.title} • {createdExam.questionCount || activeQuestionsTotalCount} سؤال • إجمالي الدرجات: {createdExam.totalDegree || totalDegreesCalculated} درجة
              </p>
            </div>

            {/* بطاقة كود الدخول ورابط الامتحان */}
            <div className="max-w-md mx-auto p-5 bg-slate-50 rounded-3xl border border-slate-200 space-y-4">
              <div>
                <p className="text-xs font-bold text-slate-500 mb-1">كود دخول الامتحان المباشر للطلاب:</p>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-3xl font-black font-mono tracking-widest text-[#03243F]">
                    {createdExam.generalCode || 'DIRECT'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(createdExam.generalCode || '');
                      setCopiedCode(true);
                      setTimeout(() => setCopiedCode(false), 2000);
                    }}
                    className="p-2 text-slate-400 hover:text-[#02936C] bg-white rounded-xl border border-slate-200 transition"
                    title="نسخ الكود"
                  >
                    {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    const studentUrl = `${window.location.origin}/student/exam/${createdExam.generalCode || ''}`;
                    navigator.clipboard.writeText(studentUrl);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                  className="w-full bg-white hover:bg-slate-100 border border-slate-200 text-[#03243F] py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-2"
                >
                  <Copy className="w-4 h-4 text-slate-400" />
                  <span>{copiedLink ? 'تم نسخ رابط الامتحان بنجاح! ✅' : 'نسخ رابط الدخول المباشر للطلاب'}</span>
                </button>
              </div>
            </div>

            {/* أزرار المشاركة والمتابعة */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
              <button
                type="button"
                onClick={() => {
                  const waLink = createExamShareWhatsAppLink(
                    createdExam.title,
                    createdExam.generalCode || 'DIRECT',
                    createdExam.durationMins,
                    createdExam.questionCount || activeQuestionsTotalCount
                  );
                  window.open(waLink, '_blank');
                }}
                className="w-full bg-[#02936C] hover:bg-[#027d5c] text-white py-3 rounded-2xl text-xs font-black shadow-md shadow-[#02936C]/20 transition flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                <span>مشاركة الرابط على جروب الواتساب 📲</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/teacher/dashboard')}
                className="w-full bg-[#03243F] hover:bg-[#063154] text-white py-3 rounded-2xl text-xs font-black transition"
              >
                الذهاب للوحة التحكم ومتابعة النتائج
              </button>
            </div>

          </div>
        )}

      </main>

    </div>
  );
}
