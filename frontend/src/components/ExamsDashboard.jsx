import React, { useState } from 'react';
import { 
  PlusCircle, BookOpen, Clock, Users, Share2, 
  ChevronLeft, Copy, Check, FileText, CheckCircle2, Award,
  Search, Sparkles, Filter, Zap, ArrowLeft, BarChart3, ScanLine
} from 'lucide-react';
import { createExamShareWhatsAppLink } from '../utils/whatsapp';

export default function ExamsDashboard({ exams = [], groupsCount = 0, onSelectExam, onOpenNewExam }) {
  const [copiedId, setCopiedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'ANSWER_SHEET' | 'CUSTOM_QUESTIONS'

  const handleCopyCode = (id, code) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleShareWhatsApp = (e, exam) => {
    e.stopPropagation();
    const code = exam.accessCodes?.[0]?.code || 'EXAM-CODE';
    const link = createExamShareWhatsAppLink(
      exam.title,
      code,
      exam.durationMins,
      exam._count?.questions || 0
    );
    window.open(link, '_blank');
  };

  // إحصائيات سريعة للمدرب
  const totalAttempts = exams.reduce((acc, ex) => acc + (ex._count?.attempts || 0), 0);
  const totalQuestions = exams.reduce((acc, ex) => acc + (ex._count?.questions || 0), 0);

  // تصفية الامتحانات بالبحث والنوع
  const filteredExams = exams.filter((exam) => {
    const matchesSearch = exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.groups?.some(g => g.group?.name?.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (filterType === 'ALL') return matchesSearch;
    return matchesSearch && exam.type === filterType;
  });

  return (
    <div className="space-y-8 text-right selection:bg-[#02936C] selection:text-white">
      
      {/* ========================================================
          1. بانر الترحيب الرسمي للمدرب (Executive Hero Banner)
      ======================================================== */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-l from-[#03243F] via-[#063154] to-[#02936C] p-6 sm:p-9 text-white shadow-xl border-2 border-white/20">
        
        {/* خلفية جمالية خفيفة بشعار المنصة */}
        <img
          src="/logo.png"
          alt=""
          className="absolute -left-12 -bottom-12 h-56 w-auto opacity-10 pointer-events-none object-contain"
        />

        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-bold text-emerald-200 border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            <span>لوحة إدارة الامتحانات والبابل شيت المتقدمة</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black leading-tight tracking-tight">
            إدارة وتصحيح امتحانات طلابك في مكان واحد
          </h1>

          <p className="text-slate-200 text-xs sm:text-sm leading-relaxed max-w-xl">
            ارفع مذكرتك PDF أو اكتب مفتاح الحل بسطر سريع، صحح أوراق البابل شيت بالكاميرا في ثوانٍ، وأرسل تقارير واتساب فورية لأولياء الأمور مع كشف كامل للغش.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-3">
            <button
              onClick={onOpenNewExam}
              className="bg-white hover:bg-slate-100 text-[#03243F] px-6 py-3 rounded-2xl text-xs sm:text-sm font-black shadow-lg transition hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4 text-[#02936C]" />
              <span>إنشاء امتحان جديد الآن</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================
          2. شريط مؤشرات أداء المعلم (Teacher KPIs Grid)
      ======================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-1.5 hover:border-[#02936C] transition">
          <div className="flex items-center justify-between">
            <span className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#02936C] flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </span>
            <span className="text-[10px] font-bold text-slate-400">الاختبارات</span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-[#03243F]">{exams.length}</p>
          <p className="text-xs font-bold text-slate-500">امتحان وواجب منشور</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-1.5 hover:border-blue-400 transition">
          <div className="flex items-center justify-between">
            <span className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </span>
            <span className="text-[10px] font-bold text-slate-400">التسليمات</span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-blue-700">{totalAttempts}</p>
          <p className="text-xs font-bold text-slate-500">ورقة مصححة ومرصودة</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-1.5 hover:border-purple-400 transition">
          <div className="flex items-center justify-between">
            <span className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </span>
            <span className="text-[10px] font-bold text-slate-400">المجموعات</span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-purple-700">{groupsCount}</p>
          <p className="text-xs font-bold text-slate-500">مجموعة وسنتر مسجل</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-1.5 hover:border-amber-400 transition">
          <div className="flex items-center justify-between">
            <span className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <Zap className="w-5 h-5" />
            </span>
            <span className="text-[10px] font-bold text-slate-400">السرعة</span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-600">0.5 ثانية</p>
          <p className="text-xs font-bold text-slate-500">متوسط تصحيح الورقة</p>
        </div>

      </div>

      {/* ========================================================
          3. شريط البحث والفلترة السريع (Search & Filter Bar)
      ======================================================== */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* حقل البحث بالاسم */}
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="ابحث عن امتحان أو مجموعة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:border-[#02936C] focus:ring-2 focus:ring-[#02936C]/20 text-xs font-bold text-slate-800 placeholder:text-slate-400 bg-slate-50"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        </div>

        {/* أزرار الفلترة حسب النوع */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              filterType === 'ALL'
                ? 'bg-[#03243F] text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            الكل ({exams.length})
          </button>
          
          <button
            onClick={() => setFilterType('ANSWER_SHEET')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              filterType === 'ANSWER_SHEET'
                ? 'bg-[#02936C] text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            ورقة إجابة (بابل شيت)
          </button>

          <button
            onClick={() => setFilterType('CUSTOM_QUESTIONS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              filterType === 'CUSTOM_QUESTIONS'
                ? 'bg-[#02936C] text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            أسئلة تفصيلية
          </button>
        </div>

      </div>

      {/* ========================================================
          4. شبكة كروت الامتحانات (Exams Grid)
      ======================================================== */}
      {filteredExams.length === 0 ? (
        <div className="bg-white rounded-[2rem] border border-slate-200 p-12 text-center max-w-lg mx-auto shadow-xs space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <BookOpen className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-black text-[#03243F]">
              {searchQuery ? 'لا توجد امتحانات مطابقة للبحث' : 'لم تقم بإنشاء أي امتحانات بعد'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {searchQuery ? 'جرّب البحث بكلمة أخرى أو مسح الفلتر' : 'ابدأ الآن بإنشاء أول امتحان بنظام البابل شيت لطلابك'}
            </p>
          </div>
          <button
            onClick={onOpenNewExam}
            className="bg-[#02936C] hover:bg-[#027d5c] text-white px-6 py-2.5 rounded-xl text-xs font-black shadow-md shadow-[#02936C]/20 transition"
          >
            + إنشاء امتحان جديد
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExams.map((exam) => {
            const code = exam.accessCodes?.[0]?.code || 'CODE';
            const groupName = exam.groups?.[0]?.group?.name || 'مجموعة عامة';
            const attemptsCount = exam._count?.attempts || 0;
            const questionsCount = exam._count?.questions || 0;

            return (
              <div
                key={exam.id}
                onClick={() => onSelectExam(exam.id)}
                className="bg-white rounded-3xl border border-slate-200/90 hover:border-[#02936C] hover:shadow-xl transition-all duration-200 p-6 cursor-pointer flex flex-col justify-between group shadow-xs space-y-4"
              >
                <div className="space-y-3">
                  
                  {/* شارات نوع الامتحان والمجموعة */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-slate-100 text-[#03243F]">
                      {groupName}
                    </span>
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                      exam.type === 'ANSWER_SHEET'
                        ? 'bg-emerald-50 text-[#02936C] border border-emerald-200'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                      {exam.type === 'ANSWER_SHEET' ? '📋 بابل شيت' : '📑 أسئلة كاملة'}
                    </span>
                  </div>

                  {/* عنوان الامتحان */}
                  <h3 className="text-base font-black text-[#03243F] group-hover:text-[#02936C] transition line-clamp-1">
                    {exam.title}
                  </h3>

                  {/* المواصفات (المدة، الأسئلة، الدرجة) */}
                  <div className="grid grid-cols-3 gap-2 py-3 bg-slate-50/70 rounded-2xl border border-slate-100 text-center">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold">المدة</p>
                      <p className="text-xs font-black text-slate-700">{exam.durationMins} د</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold">الأسئلة</p>
                      <p className="text-xs font-black text-slate-700">{questionsCount} س</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold">الدرجة</p>
                      <p className="text-xs font-black text-slate-700">{exam.totalDegree} د</p>
                    </div>
                  </div>

                  {/* كود دخول الطلاب المباشر مع زر النسخ والمشاركة */}
                  <div className="flex items-center justify-between bg-emerald-50/50 p-2.5 rounded-2xl border border-emerald-200/60 text-xs">
                    <span className="text-slate-500 font-bold">كود الامتحان:</span>
                    <div className="flex items-center gap-1.5 font-mono font-black text-[#02936C]">
                      <span className="bg-white px-2 py-0.5 rounded-lg border border-emerald-200 shadow-2xs tracking-wider">
                        {code}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyCode(exam.id, code);
                        }}
                        className="p-1 hover:text-[#03243F] transition"
                        title="نسخ الكود"
                      >
                        {copiedId === exam.id ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                    </div>
                  </div>

                </div>

                {/* أسفل الكارت: الإجراءات وعدد التسليمات */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
                    <Users className="w-4 h-4 text-[#02936C]" />
                    <span>{attemptsCount} طالب سلّموا</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => handleShareWhatsApp(e, exam)}
                      className="p-2 text-emerald-600 hover:bg-emerald-100/60 rounded-xl transition shadow-2xs"
                      title="مشاركة الامتحان على واتساب"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-black text-[#02936C] group-hover:translate-x-[-3px] transition flex items-center gap-1">
                      <span>النتائج</span>
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
