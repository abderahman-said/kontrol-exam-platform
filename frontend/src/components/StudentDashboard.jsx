import React, { useState, useEffect } from 'react';
import { 
  Award, BookOpen, Clock, AlertCircle, CheckCircle, 
  HelpCircle, ArrowRight, UserCheck, Star, Trophy, Sparkles, LogOut, Bot,
  Key, Settings, ExternalLink, Hash, CheckCircle2, ChevronRight,
  ShieldCheck, Printer, Share2, Flame, TrendingUp, Layers, Compass, MessageSquare,
  ArrowLeft
} from 'lucide-react';
import { studentAPI } from '../services/api';

export default function StudentDashboard({ onStartExam, onLogout, onOpenChatWithQuestion }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('available'); // 'available' | 'completed' | 'errors'
  const [directCode, setDirectCode] = useState('');
  const [errorSubjectFilter, setErrorSubjectFilter] = useState('ALL');
  
  // Modals state
  const [aiModal, setAiModal] = useState({ open: false, loading: false, data: null });
  const [certificateModal, setCertificateModal] = useState({ open: false, exam: null });

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await studentAPI.getDashboard();
      setData(res.data);
      // إذا لم تكن هناك امتحانات مفتوحة وفيه امتحانات مكتملة، نفتح تبويب النتائج تلقائياً
      if ((!res.data.availableExams || res.data.availableExams.length === 0) && res.data.completedExams && res.data.completedExams.length > 0) {
        setActiveTab('completed');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAiExplain = async (errItem) => {
    try {
      setAiModal({ open: true, loading: true, data: null });
      const res = await studentAPI.aiExplain({
        questionIndex: errItem.questionIndex,
        studentAnswer: errItem.studentAnswer,
        correctAnswer: errItem.correctAnswer,
        examTitle: errItem.examTitle,
        subject: errItem.subject,
        teacherName: errItem.teacherName,
        questionText: errItem.questionText
      });
      setAiModal({ open: true, loading: false, data: res.data.explanation });
    } catch (err) {
      alert('تعذر جلب شرح الذكاء الاصطناعي حالياً');
      setAiModal({ open: false, loading: false, data: null });
    }
  };

  const handleDirectCodeSubmit = (e) => {
    e.preventDefault();
    if (!directCode.trim()) return;
    onStartExam(directCode.trim().toUpperCase(), data?.student?.name || '');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4 text-center">
        <div className="w-12 h-12 border-4 border-[#02936C] border-t-transparent rounded-full animate-spin"></div>
        <div className="space-y-1">
          <p className="text-base font-black text-[#03243F]">جاري تحميل حسابك الدراسي ودرجاتك...</p>
          <p className="text-xs text-slate-400">منظومة كَنترول الذكية للامتحانات</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { student, availableExams = [], completedExams = [], errorBank = [], stats } = data;
  const honorExamsCount = completedExams.filter(e => e.isHonorRoll).length;
  const availableSubjects = ['ALL', ...new Set(errorBank.map(e => e.subject).filter(Boolean))];

  return (
    <div className="max-w-5xl mx-auto space-y-8 text-right pb-20 selection:bg-[#02936C] selection:text-white">
      
      {/* ========================================================
          1. بطاقة ترحيب الطالب الرسمية (Student Executive Profile)
      ======================================================== */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-l from-[#03243F] via-[#063154] to-[#02936C] p-6 sm:p-8 text-white shadow-xl border-2 border-white/20">
        
        {/* خلفية جمالية خفيفة بشعار المنصة */}
        <img
          src="/logo.png"
          alt=""
          className="absolute -left-10 -bottom-10 h-48 w-auto opacity-10 pointer-events-none object-contain"
        />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          
          {/* بيانات الطالب والمواد المسجلة */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-white/10 backdrop-blur-md border-2 border-white/30 text-white flex items-center justify-center text-2xl sm:text-3xl font-black shadow-inner shrink-0">
              {student.name ? student.name.charAt(0) : '🎓'}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-white/20 backdrop-blur-md px-3 py-0.5 rounded-full text-[11px] font-bold inline-flex items-center gap-1 text-emerald-200">
                  <Sparkles className="w-3 h-3 text-emerald-300" />
                  <span>طالب معتمد في كَنترول</span>
                </span>
                
                {stats.averagePercentage >= 85 ? (
                  <span className="bg-amber-400 text-[#03243F] px-2.5 py-0.5 rounded-full text-[10px] font-black inline-flex items-center gap-1 shadow-2xs">
                    <Trophy className="w-3 h-3" />
                    <span>من المتفوقين 🌟</span>
                  </span>
                ) : (
                  <span className="bg-white/10 px-2.5 py-0.5 rounded-full text-[10px] font-medium text-slate-200">
                    مستوى أكاديمي واعد 🎯
                  </span>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                أهلاً بك يا {student.name} 👋
              </h1>

              {/* المواد والمجموعات المسجل بها */}
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                {student.enrolledGroups && student.enrolledGroups.length > 0 ? (
                  student.enrolledGroups.map((eg, idx) => (
                    <span key={idx} className="bg-black/20 backdrop-blur-xs px-2.5 py-0.5 rounded-lg text-[10px] font-bold border border-white/15 text-slate-200">
                      {eg.subject || 'مادة'}: {eg.teacherName}
                    </span>
                  ))
                ) : (
                  <span className="text-[11px] text-slate-300">
                    {student.groupName} • {student.teacherName}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* زر تسجيل الخروج */}
          <button
            onClick={onLogout}
            className="bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 border border-white/20 hover:border-white/40 shadow-xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>تسجيل الخروج</span>
          </button>

        </div>
      </div>

      {/* ========================================================
          2. مؤشرات الأداء والإنجاز الأكاديمي (KPI Stat Cards)
      ======================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* الكارت 1: الامتحانات المكتملة */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs hover:border-[#02936C] transition space-y-2">
          <div className="flex items-center justify-between">
            <span className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#02936C] flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </span>
            <span className="text-[10px] font-bold text-slate-400">سجل الإنجاز</span>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black text-[#03243F]">{stats.totalExamsTaken}</p>
            <p className="text-xs font-bold text-slate-500">امتحان وواجب مكتمل</p>
          </div>
          <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>تم تصحيحها ورصدها</span>
          </p>
        </div>

        {/* الكارت 2: المعدل العام التراكمي */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs hover:border-[#02936C] transition space-y-2">
          <div className="flex items-center justify-between">
            <span className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5" />
            </span>
            <span className="text-[10px] font-bold text-slate-400">التقييم العام</span>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black text-[#02936C]">{stats.averagePercentage}%</p>
            <p className="text-xs font-bold text-slate-500">متوسط الدرجات التراكمي</p>
          </div>
          {/* شريط تقدم ملون */}
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-teal-500 to-[#02936C] rounded-full transition-all duration-500"
              style={{ width: `${Math.min(stats.averagePercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* الكارت 3: بنك أخطائي للمراجعة */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs hover:border-amber-400 transition space-y-2">
          <div className="flex items-center justify-between">
            <span className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </span>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-100/60 px-2 py-0.5 rounded-full">
              Gemini AI
            </span>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black text-amber-600">{stats.totalErrorsToRevise}</p>
            <p className="text-xs font-bold text-slate-500">سؤال في بنك الأخطاء</p>
          </div>
          <p className="text-[10px] text-amber-800 font-bold">
            جاهز للشرح الذكي والتدريب 💡
          </p>
        </div>

        {/* الكارت 4: شهادات التقدير ولوحة الشرف */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs hover:border-purple-400 transition space-y-2">
          <div className="flex items-center justify-between">
            <span className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
              <Trophy className="w-5 h-5" />
            </span>
            <span className="text-[10px] font-bold text-purple-700 bg-purple-100/60 px-2 py-0.5 rounded-full">
              +85%
            </span>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black text-purple-700">{honorExamsCount}</p>
            <p className="text-xs font-bold text-slate-500">شهادات تفوق محققة</p>
          </div>
          <p className="text-[10px] text-purple-800 font-bold">
            مؤهل للوحة الشرف الرسمية 🏆
          </p>
        </div>

      </div>

      {/* ========================================================
          3. كارت إدخال كود الامتحان المباشر السريع (Quick Exam Code)
      ======================================================== */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 w-full sm:w-auto">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-[#02936C] flex items-center justify-center font-black text-lg shadow-2xs shrink-0">
            <Hash className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-black text-[#03243F]">معاك كود امتحان أرسله المعلم على واتساب؟</p>
            <p className="text-[11px] text-slate-400">أدخل كود الامتحان هنا للبدء مباشرة دون الحاجة للبحث في القائمة</p>
          </div>
        </div>

        <form onSubmit={handleDirectCodeSubmit} className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="مثال: 45TFWG"
            value={directCode}
            onChange={(e) => setDirectCode(e.target.value)}
            className="border-2 border-slate-200 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-mono font-bold uppercase focus:ring-2 focus:ring-[#02936C] focus:border-[#02936C] focus:outline-none flex-1 sm:w-52 text-center bg-slate-50"
          />
          <button
            type="submit"
            disabled={!directCode.trim()}
            className="bg-[#02936C] hover:bg-[#027d5c] disabled:opacity-40 text-white px-5 py-2.5 rounded-2xl text-xs font-bold transition shadow-md shadow-[#02936C]/20 whitespace-nowrap flex items-center gap-1.5"
          >
            <span>دخول الامتحان</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* ========================================================
          4. شريط التبويبات الفاخر (Segmented Tab Bar)
      ======================================================== */}
      <div className="flex items-center gap-2 bg-slate-200/60 p-1.5 rounded-2xl border border-slate-300/60 max-w-full overflow-x-auto">
        
        {/* تبويب 1 */}
        <button
          onClick={() => setActiveTab('available')}
          className={`flex-1 min-w-[150px] py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
            activeTab === 'available'
              ? 'bg-white text-[#03243F] shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>🚀 الامتحانات المتاحة</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
            activeTab === 'available' ? 'bg-[#02936C] text-white' : 'bg-slate-300 text-slate-700'
          }`}>
            {availableExams.length}
          </span>
        </button>

        {/* تبويب 2 */}
        <button
          onClick={() => setActiveTab('completed')}
          className={`flex-1 min-w-[150px] py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
            activeTab === 'completed'
              ? 'bg-white text-[#03243F] shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>📜 نتائجي وشهاداتي</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
            activeTab === 'completed' ? 'bg-[#03243F] text-white' : 'bg-slate-300 text-slate-700'
          }`}>
            {completedExams.length}
          </span>
        </button>

        {/* تبويب 3 */}
        <button
          onClick={() => setActiveTab('errors')}
          className={`flex-1 min-w-[150px] py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
            activeTab === 'errors'
              ? 'bg-white text-amber-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>💡 بنك أخطائي الذكي</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
            activeTab === 'errors' ? 'bg-amber-500 text-white' : 'bg-slate-300 text-slate-700'
          }`}>
            {errorBank.length}
          </span>
        </button>

      </div>

      {/* ========================================================
          5. تبويب 1: الامتحانات والواجبات المفتوحة للحل
      ======================================================== */}
      {activeTab === 'available' && (
        <div className="space-y-4">
          {availableExams.length === 0 ? (
            <div className="bg-white rounded-[2rem] p-12 text-center border border-slate-200/90 shadow-xs space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-[#02936C] flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h3 className="text-base font-black text-[#03243F]">عاش يا بطل! لقد حللت كل الاختبارات المتاحة حالياً 🌟</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                لا توجد امتحانات جديدة معلقة في مجموعاتك حالياً. يمكنك مراجعة أخطائك السابقة من تبويب "بنك أخطائي" للاستعداد لأي امتحان قادم.
              </p>
            </div>
          ) : (
            availableExams.map((exam) => (
              <div
                key={exam.id}
                className="bg-white p-6 rounded-3xl border border-slate-200/90 hover:border-[#02936C] transition shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-5 group"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <span className="font-bold bg-emerald-50 text-[#02936C] border border-emerald-200 px-2.5 py-0.5 rounded-full text-[11px]">
                      {exam.type === 'ANSWER_SHEET' ? 'ورقة إجابة (بابل شيت)' : 'أسئلة تفصيلية'}
                    </span>
                    
                    {exam.subject && (
                      <span className="font-bold bg-[#03243F]/10 text-[#03243F] px-2.5 py-0.5 rounded-full text-[11px]">
                        مادة {exam.subject}
                      </span>
                    )}

                    {exam.teacherName && (
                      <span className="text-slate-500 font-medium">
                        • المعلم: <strong>{exam.teacherName}</strong>
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-black text-[#03243F] group-hover:text-[#02936C] transition">
                    {exam.title}
                  </h3>

                  <div className="flex items-center gap-4 text-xs text-slate-500 font-semibold">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {exam.durationMins} دقيقة
                    </span>
                    <span>• {exam.totalDegree} درجة</span>
                    <span>• {exam.questionsCount} سؤال</span>
                  </div>
                </div>

                <button
                  onClick={() => onStartExam(exam.code, student.name)}
                  className="w-full md:w-auto bg-[#02936C] hover:bg-[#027d5c] text-white px-7 py-3 rounded-2xl text-xs font-black shadow-md shadow-[#02936C]/25 transition hover:scale-105 flex items-center justify-center gap-2 shrink-0"
                >
                  <span>بدء حل الامتحان الآن</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* ========================================================
          6. تبويب 2: سجل النتائج السابقة وشهادات التقدير
      ======================================================== */}
      {activeTab === 'completed' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-black text-[#03243F]">سجل الاختبارات التي قمت بتسليمها ({completedExams.length})</h3>
            <span className="text-xs text-slate-400">يتم رصد وحفظ الدرجات تلقائياً</span>
          </div>

          {completedExams.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              لم تقم بتسليم أي امتحانات بعد. ادخل على "الامتحانات المتاحة" لبدء أول اختبار لك!
            </div>
          ) : (
            <div className="space-y-3">
              {completedExams.map((att) => (
                <div
                  key={att.attemptId}
                  className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:bg-white hover:border-slate-300 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold bg-[#03243F] text-white px-2 py-0.5 rounded-md">
                        {att.subject || 'مادة'}
                      </span>
                      <h4 className="text-sm font-black text-[#03243F]">{att.examTitle}</h4>
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium">
                      تم التسليم في: {new Date(att.submittedAt).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    
                    {/* الدرجة والنسبة */}
                    <div className="text-left">
                      <p className="text-base font-black text-[#03243F]">
                        {att.score} <span className="text-xs text-slate-400 font-medium">/ {att.totalDegree}</span>
                      </p>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full inline-block ${
                        att.percentage >= 85
                          ? 'bg-emerald-100 text-emerald-800'
                          : att.percentage >= 50
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {att.percentage}%
                      </span>
                    </div>

                    {/* زر شهادة التقدير إن كان متفوقاً */}
                    {att.isHonorRoll && (
                      <button
                        onClick={() => setCertificateModal({ open: true, exam: att })}
                        className="bg-amber-500 hover:bg-amber-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                      >
                        <Trophy className="w-3.5 h-3.5 text-amber-100" />
                        <span>شهادة التفوق 🌟</span>
                      </button>
                    )}

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          7. تبويب 3: بنك أخطائي الذكي (Smart Error Bank)
      ======================================================== */}
      {activeTab === 'errors' && (
        <div className="space-y-4">
          
          {/* بانر إشعار حالة الذكاء الاصطناعي الحقيقي */}
          <div className="p-5 bg-gradient-to-l from-amber-50 via-amber-50/60 to-white border border-amber-200/80 rounded-3xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-amber-600" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <p className="text-xs sm:text-sm font-black text-amber-950">بنك أخطائك الشخصي الذكي</p>
                  <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 shadow-2xs">
                    ✨ مدعوم بـ Google Gemini
                  </span>
                </div>
                <p className="text-xs text-amber-900/80 leading-relaxed">
                  هنا يتم تجميع كل سؤال أخطأت فيه في كل الاختبارات، لتذاكرها قبل امتحانات نهاية العام بنظام الشرح التربوي بالذكاء الاصطناعي.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                if (onOpenChatWithQuestion) {
                  onOpenChatWithQuestion(null);
                }
              }}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#03243F] to-[#02936C] hover:from-[#053760] hover:to-[#027d5c] text-white font-black text-xs flex items-center gap-2 shrink-0 transition shadow-sm hover:scale-105 active:scale-95"
            >
              <Bot className="w-4 h-4 text-emerald-300" />
              <span>دردش مع مستر كَنترول 💬</span>
            </button>
          </div>

          {errorBank.length === 0 ? (
            <div className="bg-white rounded-[2rem] p-12 text-center border border-slate-200 shadow-xs space-y-3">
              <CheckCircle className="w-14 h-14 text-emerald-500 mx-auto" />
              <h3 className="text-base font-black text-[#03243F]">ما شاء الله! بنك أخطائك فارغ تماماً 🎉</h3>
              <p className="text-xs text-slate-400">كل إجاباتك في الامتحانات السابقة كانت صحيحة 100%.</p>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* شريط فلترة المواد */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <span className="text-xs font-bold text-slate-500 shrink-0">فلترة المادة:</span>
                {availableSubjects.map((subj) => {
                  const count = subj === 'ALL' ? errorBank.length : errorBank.filter(e => e.subject === subj).length;
                  return (
                    <button
                      key={subj}
                      onClick={() => setErrorSubjectFilter(subj)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
                        errorSubjectFilter === subj
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      <span>{subj === 'ALL' ? 'جميع المواد' : subj}</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                        errorSubjectFilter === subj ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* شبكة كروت الأخطاء */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {errorBank
                  .filter(e => errorSubjectFilter === 'ALL' || e.subject === errorSubjectFilter)
                  .map((errItem) => (
                    <div
                      key={errItem.id}
                      className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3 hover:border-amber-300 transition"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold bg-[#03243F] text-white px-2 py-0.5 rounded-md">
                            {errItem.subject || 'مادة عامة'}
                          </span>
                          <span className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full truncate max-w-[130px]" title={errItem.examTitle}>
                            {errItem.examTitle}
                          </span>
                        </div>
                        <span className="text-xs font-black text-slate-800 shrink-0">
                          سؤال ({errItem.questionIndex})
                        </span>
                      </div>

                      {/* مقارنة الإجابة */}
                      <div className="flex items-center justify-around py-2.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs font-bold">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500">إجابتك:</span>
                          <span className="w-7 h-7 rounded-full bg-red-100 text-red-700 inline-flex items-center justify-center font-black">
                            {errItem.studentAnswer || 'فارغ'}
                          </span>
                        </div>

                        <div className="w-px h-6 bg-slate-200" />

                        <div className="flex items-center gap-2">
                          <span className="text-slate-500">الإجابة الصحيحة:</span>
                          <span className="w-7 h-7 rounded-full bg-emerald-100 text-[#02936C] inline-flex items-center justify-center font-black">
                            {errItem.correctAnswer}
                          </span>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-600 leading-relaxed bg-slate-50/60 p-2.5 rounded-xl border border-slate-100">
                        💡 <strong>توضيح المعلم:</strong> {errItem.explanation}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        <button
                          onClick={() => handleRequestAiExplain(errItem)}
                          className="w-full bg-gradient-to-r from-teal-600 to-[#02936C] hover:from-teal-700 hover:to-[#027d5c] text-white py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-xs transition hover:scale-[1.01]"
                        >
                          <Bot className="w-4 h-4" />
                          <span>🤖 تحليل فوري</span>
                        </button>

                        <button
                          onClick={() => {
                            if (onOpenChatWithQuestion) {
                              onOpenChatWithQuestion({
                                questionIndex: errItem.questionIndex || errItem.questionNumber || 1,
                                questionText: errItem.questionText || errItem.question || 'سؤال في ' + (errItem.subject || 'المادة'),
                                studentAnswer: errItem.studentAnswer || 'فارغ',
                                correctAnswer: errItem.correctAnswer || 'غير محدد',
                                explanation: errItem.explanation || 'راجع المفهوم مع معلمك',
                                subject: errItem.subject || 'مادة عامة',
                                examTitle: errItem.examTitle || errItem.exam || 'الامتحان'
                              });
                            }
                          }}
                          className="w-full bg-[#03243F] hover:bg-[#053760] text-white py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-xs transition hover:scale-[1.01]"
                        >
                          <MessageSquare className="w-4 h-4 text-emerald-400" />
                          <span>💬 اسأل مستر كَنترول</span>
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          8. نافذة الشرح بالذكاء الاصطناعي (AI Tutor Modal)
      ======================================================== */}
      {aiModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#03243F] to-[#02936C] text-white flex items-center justify-center shadow-sm">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-[#03243F]">المعلم الذكي (AI Tutor)</h3>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium">
                    تحليل السؤال رقم ({aiModal.data?.questionNumber || ''}) • {aiModal.data?.subject ? `مادة ${aiModal.data?.subject}` : ''} • {aiModal.data?.exam || ''}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAiModal({ open: false, loading: false, data: null })}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-xs font-bold transition"
              >
                ✕
              </button>
            </div>

            {aiModal.loading ? (
              <div className="py-14 text-center space-y-3">
                <div className="w-10 h-10 border-4 border-[#02936C] border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-xs font-bold text-slate-600">Google Gemini AI يحلل السؤال ويبني خطوات الشرح المخصصة لك...</p>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                
                {/* 1. تحليل الخطأ والفخ */}
                <div className="p-4 bg-red-50 border border-red-200/80 rounded-2xl space-y-1">
                  <p className="font-bold text-red-900 flex items-center gap-1">
                    <span>🔍 تحليل الفخ: لماذا خيارك ({aiModal.data?.studentChoice}) كان غير دقيق؟</span>
                  </p>
                  <p className="text-slate-700 leading-relaxed font-medium">{aiModal.data?.analysis}</p>
                </div>

                {/* 2. خطوات الحل النموذجي */}
                <div className="p-4 bg-emerald-50 border border-emerald-200/80 rounded-2xl space-y-2">
                  <p className="font-bold text-[#02936C] flex items-center gap-1">
                    <span>✅ خطوات الوصول للإجابة النموذجية ({aiModal.data?.correctChoice}):</span>
                  </p>
                  <ul className="space-y-2 text-slate-700">
                    {aiModal.data?.steps?.map((step, idx) => (
                      <li key={idx} className="leading-relaxed bg-white/70 p-2 rounded-xl border border-emerald-100">
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 3. القاعدة الذهبية */}
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 font-bold leading-relaxed">
                  {aiModal.data?.goldenRule}
                </div>

                {/* 4. نصيحة الامتحان */}
                <div className="p-3.5 bg-slate-100 rounded-2xl text-slate-700 font-semibold leading-relaxed">
                  {aiModal.data?.examTip}
                </div>

                {/* 5. زر الانتقال للمناقشة والشات مع مستر كَنترول */}
                <button
                  onClick={() => {
                    const ctx = {
                      questionIndex: aiModal.data?.questionNumber || 1,
                      questionText: aiModal.data?.questionText || 'سؤال في ' + (aiModal.data?.subject || 'المادة'),
                      studentAnswer: aiModal.data?.studentChoice || 'فارغ',
                      correctAnswer: aiModal.data?.correctChoice || 'غير محدد',
                      explanation: aiModal.data?.analysis || aiModal.data?.goldenRule || '',
                      subject: aiModal.data?.subject || 'مادة عامة',
                      examTitle: aiModal.data?.exam || 'الامتحان'
                    };
                    setAiModal({ open: false, loading: false, data: null });
                    if (onOpenChatWithQuestion) {
                      onOpenChatWithQuestion(ctx);
                    }
                  }}
                  className="w-full bg-[#03243F] hover:bg-[#053760] text-white py-3 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-sm transition hover:scale-[1.01]"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <span>💬 محتاج توضيح أكتر؟ افتح شات مباشر مع مستر كَنترول</span>
                </button>

              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          9. نافذة شهادة التقدير الإلكترونية الرسمية (Honor Certificate)
      ======================================================== */}
      {certificateModal.open && certificateModal.exam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2rem] max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border-4 border-amber-400 relative overflow-hidden text-center">
            
            {/* زخرفة خلفية */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-100 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between">
              <img src="/logo.png" alt="كَنترول" className="h-9 w-auto object-contain" />
              <button
                onClick={() => setCertificateModal({ open: false, exam: null })}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-xs font-bold transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-black text-amber-600 bg-amber-50 border border-amber-300 px-3 py-1 rounded-full uppercase tracking-widest inline-flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5" />
                شهادة تفوق وتقدير رسمية
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[#03243F]">
                لوحة الشرف الأكاديمية 🌟
              </h2>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
              تتقدّم إدارة المنصة والمعلم بخالص التهاني للطالب المتميز:
            </p>

            <div className="py-3 px-6 bg-amber-50 border-2 border-amber-300/80 rounded-2xl max-w-md mx-auto">
              <p className="text-xl sm:text-2xl font-black text-[#03243F]">{student.name}</p>
            </div>

            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
              لحصوله على درجة <strong>{certificateModal.exam.score} من {certificateModal.exam.totalDegree}</strong> بنسبة <strong>({certificateModal.exam.percentage}%)</strong> في امتحان <strong>"{certificateModal.exam.examTitle}"</strong> بتفوق واقتدار.
            </p>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-[11px] font-bold text-slate-500">
              <span>ختم الاعتماد: منصة كَنترول ✓</span>
              <span>التاريخ: {new Date(certificateModal.exam.submittedAt).toLocaleDateString('ar-EG')}</span>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => window.print()}
                className="bg-[#03243F] hover:bg-[#063154] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة الشهادة</span>
              </button>
              <button
                onClick={() => setCertificateModal({ open: false, exam: null })}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl text-xs font-bold transition"
              >
                إغلاق
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
