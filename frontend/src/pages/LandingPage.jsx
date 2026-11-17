import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Check, Sparkles, Smartphone, Award, Bot, FileText,
  CheckCircle2, Users, ShieldAlert, BookOpen, ExternalLink, Hash, Lock,
  CheckCheck, MessageCircle, BarChart3, Zap, Play, Layers, RefreshCw,
  ScanLine, HelpCircle, Trophy, Star
} from 'lucide-react';
import Logo from '../components/Logo';

export default function LandingPage() {
  const navigate = useNavigate();
  const [directCode, setDirectCode] = useState('');
  const [activeTab, setActiveTab] = useState('teacher'); // 'teacher' | 'student' | 'parent'
  const [interactiveKey, setInteractiveKey] = useState('أ ب ج د ب أ ج د');

  // معالجة إدخال كود الامتحان المباشر
  const handleQuickExam = (e) => {
    e.preventDefault();
    if (!directCode.trim()) return;
    navigate(`/student/exam/${directCode.trim().toUpperCase()}`);
  };

  // محاكاة تحليل سطر المفتاح السريع
  const parsedKey = interactiveKey
    .trim()
    .split(/[\s,-]+/)
    .filter(Boolean)
    .slice(0, 8);

  return (
    <div dir="rtl" className="min-h-screen bg-[#F8FAFC] text-[#03243F] font-cairo flex flex-col justify-between selection:bg-[#02936C] selection:text-white overflow-x-hidden">
      
      {/* ========================================================
          1. الهيدر العلوي الاحترافي (Navbar)
      ======================================================== */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* الشعار الرسمي */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <Logo size="md" />
          </div>

          {/* روابط سريعة للمنصة */}
          <div className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-600">
            <a href="#features" className="hover:text-[#02936C] transition">المميزات الرئيسية</a>
            <a href="#how-it-works" className="hover:text-[#02936C] transition">كيف يعمل النظام؟</a>
            <a href="#ai-tutor" className="hover:text-[#02936C] transition flex items-center gap-1 text-[#02936C]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>المعلم الذكي (AI)</span>
            </a>
            <a href="#interactive-demo" className="hover:text-[#02936C] transition">تجربة حية</a>
          </div>

          {/* أزرار الدخول */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => navigate('/student/login')}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition flex items-center gap-1.5"
            >
              <span>🎓 دخول الطلاب</span>
            </button>
            <button
              onClick={() => navigate('/teacher/login')}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#02936C] hover:bg-[#027d5c] shadow-md shadow-[#02936C]/25 transition hover:scale-[1.02] flex items-center gap-1.5"
            >
              <span>👨‍🏫 دخول المعلم</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 space-y-20 pb-20">

        {/* ========================================================
            2. البانر الرئيسي التفاعلي (Hero Section)
        ======================================================== */}
        <section className="relative pt-12 pb-16 overflow-hidden">
          {/* تدرجات ضوئية جمالية مستوحاة من ألوان اللوجو */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#02936C]/10 rounded-full blur-3xl pointer-events-none -z-10" />
          <div className="absolute top-20 left-10 w-96 h-96 bg-[#03243F]/10 rounded-full blur-3xl pointer-events-none -z-10" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              {/* النص التعريفي والدعوة للعمل (Left/Right RTL) */}
              <div className="lg:col-span-7 space-y-6 text-right">
                
                {/* شارة التميز */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-[#02936C] text-xs font-bold shadow-2xs">
                  <Sparkles className="w-4 h-4 text-[#02936C]" />
                  <span>المنظومة المتكاملة الأولى للبابل شيت والامتحانات في مصر 🇪🇬</span>
                </div>

                {/* العنوان الرئيسي الضخم */}
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#03243F] !leading-[1.5] tracking-tight">
                  حوّل تصحيح امتحاناتك <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-l from-[#02936C] via-teal-600 to-[#03243F]">
                    من ساعات إرهاق إلى ثوانٍ معدودة!
                  </span>
                </h1>

                {/* الوصف */}
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl">
                  منصة السحاب الأولى التي تجمع <strong>المعلم</strong>، <strong>الطالب</strong>، و<strong>ولي الأمر</strong> في مكان واحد: أنشئ الامتحان بسطر مفتاح واحد، صحح بالكاميرا، ووفّر 90% من وقت ومجهود مساعديك مع تقارير واتساب فورية وبنك أخطاء مدعوم بالذكاء الاصطناعي.
                </p>

                {/* أزرار الإجراءات الرئيسية */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                  <button
                    onClick={() => navigate('/teacher/login')}
                    className="px-7 py-3.5 rounded-2xl bg-[#03243F] hover:bg-[#063154] text-white text-sm font-bold shadow-lg shadow-[#03243F]/20 flex items-center justify-center gap-2 transition hover:scale-[1.02]"
                  >
                    <span>ابدأ كمعلم الآن مجاناً</span>
                    <ArrowLeft className="w-4 h-4 text-[#02936C]" />
                  </button>

                  <button
                    onClick={() => navigate('/student/login')}
                    className="px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-100 text-[#03243F] border border-slate-300 text-sm font-bold shadow-xs flex items-center justify-center gap-2 transition"
                  >
                    <span>دخول الطالب المستقل</span>
                  </button>
                </div>

                {/* كارت إدخال كود الامتحان المباشر الفوري */}
                <div className="pt-3 max-w-lg">
                  <form onSubmit={handleQuickExam} className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#02936C] flex items-center justify-center font-black shrink-0">
                      <Hash className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      placeholder="معاك كود امتحان؟ أدخله هنا (مثل: 45TFWG)"
                      value={directCode}
                      onChange={(e) => setDirectCode(e.target.value)}
                      className="flex-1 text-xs sm:text-sm font-bold placeholder:text-slate-400 focus:outline-none uppercase font-mono px-2"
                    />
                    <button
                      type="submit"
                      disabled={!directCode.trim()}
                      className="bg-[#02936C] hover:bg-[#027d5c] disabled:opacity-40 text-white px-4 py-2.5 rounded-xl text-xs font-bold shrink-0 transition"
                    >
                      دخول الامتحان
                    </button>
                  </form>
                </div>

                {/* مميزات سريعة تحت الأزرار */}
                <div className="flex items-center gap-6 text-xs font-semibold text-slate-500 pt-1 flex-wrap">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#02936C]" />
                    بدون اشتراكات معقدة
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#02936C]" />
                    يعمل على أي موبايل واقتصادي النت
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#02936C]" />
                    دعم كامل للغة العربية (RTL)
                  </span>
                </div>

              </div>

              {/* بطاقة العرض التفاعلية الحية (Live Interactive Preview Mockup) */}
              <div className="lg:col-span-5 relative">
                
                {/* خلفية جمالية للكارت */}
                <div className="relative mx-auto max-w-sm bg-gradient-to-tr from-[#03243F] to-[#063154] rounded-[2.5rem] p-4 shadow-2xl shadow-[#03243F]/30 border-4 border-white">
                  
                  {/* شاشة الموبايل المحاكية */}
                  <div className="bg-slate-50 rounded-[2rem] overflow-hidden p-4 space-y-4 text-slate-800">
                    
                    {/* هيدر الموبايل */}
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                      <div className="flex items-center gap-2">
                        <img src="/logo.png" alt="كَنترول" className="h-7 w-auto object-contain" />
                      </div>
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                        🟢 مباشر
                      </span>
                    </div>

                    {/* محاكاة مسح البابل شيت بالكاميرا */}
                    <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-2 relative overflow-hidden">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                        <span className="flex items-center gap-1">
                          <ScanLine className="w-3.5 h-3.5 text-[#02936C]" />
                          كاميرا الماسح الذكي OMR
                        </span>
                        <span className="text-[10px] text-slate-400">ورقة #142</span>
                      </div>

                      {/* عينة صفوف البابل شيت */}
                      <div className="space-y-1.5 py-1">
                        {[
                          { q: 1, val: 'أ', status: 'correct' },
                          { q: 2, val: 'ب', status: 'correct' },
                          { q: 3, val: 'ج', status: 'wrong' },
                          { q: 4, val: 'د', status: 'correct' },
                        ].map((item) => (
                          <div key={item.q} className="flex items-center justify-between text-[11px] bg-slate-50 px-2.5 py-1 rounded-lg">
                            <span className="font-bold text-slate-500">سؤال {item.q}</span>
                            <div className="flex items-center gap-1 font-bold">
                              {['أ', 'ب', 'ج', 'د'].map((opt) => (
                                <span
                                  key={opt}
                                  className={`w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px] ${
                                    opt === item.val
                                      ? item.status === 'correct'
                                        ? 'bg-[#02936C] text-white'
                                        : 'bg-red-500 text-white'
                                      : 'border border-slate-200 text-slate-400'
                                  }`}
                                >
                                  {opt}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* شريط المسح الليزري المتحرك */}
                      <div className="h-1 bg-gradient-to-r from-transparent via-[#02936C] to-transparent rounded-full animate-pulse" />
                    </div>

                    {/* إشعار واتساب التلقائي لولي الأمر */}
                    <div className="bg-emerald-500 text-white p-3 rounded-2xl flex items-center justify-between shadow-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                          <MessageCircle className="w-4 h-4 text-white" />
                        </div>
                        <div className="text-right">
                          <p className="text-[11px] font-bold">تم إرسال تقرير واتساب</p>
                          <p className="text-[9px] text-emerald-100">درجة الطالب: 38 من 40 (ممتاز 🌟)</p>
                        </div>
                      </div>
                      <span className="text-[10px] bg-white text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                        فوري ✓
                      </span>
                    </div>

                    {/* كارت المعلم الذكي بالذكاء الاصطناعي */}
                    <div className="bg-amber-50 border border-amber-200/80 p-3 rounded-2xl text-right space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Bot className="w-3 h-3" />
                          <span>Google Gemini AI</span>
                        </span>
                        <span className="text-[9px] text-amber-700 font-bold">شرح الخطأ رقم 3</span>
                      </div>
                      <p className="text-[10px] text-slate-700 leading-tight">
                        "يا بطل، اختيارك (ج) كان فخاً بسبب نسيان تربيع نصف القطر في قانون المقاومة.."
                      </p>
                    </div>

                  </div>
                </div>

                {/* شارة طافية 1: السرعة */}
                <div className="absolute -top-4 -right-4 bg-white p-3 rounded-2xl shadow-xl border border-slate-200 flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-[#02936C] flex items-center justify-center font-bold">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-[#03243F]">0.5 ثانية</p>
                    <p className="text-[10px] text-slate-400">زمن تصحيح الورقة</p>
                  </div>
                </div>

                {/* شارة طافية 2: دقة الرصد */}
                <div className="absolute -bottom-4 -left-4 bg-white p-3 rounded-2xl shadow-xl border border-slate-200 flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                    <Award className="w-5 h-5" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-[#03243F]">دقة 99.9%</p>
                    <p className="text-[10px] text-slate-400">مع كشف التظليل المزدوج</p>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </section>

        {/* ========================================================
            3. شريط المؤشرات الرقمية (KPIs Bar)
        ======================================================== */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#03243F] text-white rounded-3xl p-8 sm:p-10 shadow-xl border border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-slate-800">
            
            <div className="space-y-1">
              <p className="text-3xl sm:text-4xl font-black text-[#02936C]">1 دقيقة</p>
              <p className="text-xs text-slate-300 font-bold">لإنشاء ونشر أي امتحان</p>
              <span className="text-[10px] text-slate-400 block">بسطر المفتاح السريع أو الـ PDF</span>
            </div>

            <div className="space-y-1 pt-4 md:pt-0">
              <p className="text-3xl sm:text-4xl font-black text-emerald-400">0.5 ثانية</p>
              <p className="text-xs text-slate-300 font-bold">لتصحيح ورقة البابل شيت</p>
              <span className="text-[10px] text-slate-400 block">بكاميرا موبايلك العادي</span>
            </div>

            <div className="space-y-1 pt-4 md:pt-0">
              <p className="text-3xl sm:text-4xl font-black text-teal-300">4 نماذج</p>
              <p className="text-xs text-slate-300 font-bold">توليد تلقائي للنماذج</p>
              <span className="text-[10px] text-slate-400 block">للقضاء على الغش داخل القاعة</span>
            </div>

            <div className="space-y-1 pt-4 md:pt-0">
              <p className="text-3xl sm:text-4xl font-black text-amber-400">Gemini AI</p>
              <p className="text-xs text-slate-300 font-bold">معلم ذكي يشرح الأخطاء</p>
              <span className="text-[10px] text-slate-400 block">مخصص لنظام الثانوية العامة</span>
            </div>

          </div>
        </section>

        {/* ========================================================
            4. رحلة الاستخدام السهلة (3 خطوات فقط)
        ======================================================== */}
        <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-black text-[#02936C] bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full uppercase tracking-wider">
              سهولة مطلقة للمدرس والمساعد
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-[#03243F]">
              ثلاث خطوات فقط.. والامتحان جاهز ومصحح!
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              صممنا تجربة المستخدم لتكون الأسرع والأبسط، بدون تعقيدات وبدون خطوات إضافية غير ضرورية.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* الخطوة 1 */}
            <div className="bg-white p-7 rounded-3xl border border-slate-200 shadow-xs space-y-4 hover:border-[#02936C] transition group">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 group-hover:bg-[#03243F] group-hover:text-white text-[#03243F] flex items-center justify-center font-black text-xl transition">
                1
              </div>
              <h3 className="text-lg font-black text-[#03243F]">أنشئ الامتحان ومفتاحه</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                اكتب سطر المفتاح بضغطة زر مثل <code>"أ ب ج د"</code> أو ارفع ملف مذكرة الـ PDF الخاص بك. النظام سيتعرف على الأسئلة فوراً.
              </p>
              <div className="text-[11px] font-bold text-[#02936C] flex items-center gap-1">
                <span>يدعم الحفظ التلقائي كمسودة</span>
                <Check className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* الخطوة 2 */}
            <div className="bg-white p-7 rounded-3xl border border-slate-200 shadow-xs space-y-4 hover:border-[#02936C] transition group">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 group-hover:bg-[#02936C] group-hover:text-white text-[#02936C] flex items-center justify-center font-black text-xl transition">
                2
              </div>
              <h3 className="text-lg font-black text-[#03243F]">صحح بالكاميرا أو أونلاين</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                صوّر أوراق البابل شيت الخاصة بطلابك بالموبايل، أو دع الطلاب يحلون أونلاين عبر البوابة المستقلة مع حماية ضد الغش ومغادرة التبويب.
              </p>
              <div className="text-[11px] font-bold text-[#02936C] flex items-center gap-1">
                <span>تظليل باهت أو مزدوج؟ يُراجع بنقرة</span>
                <Check className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* الخطوة 3 */}
            <div className="bg-white p-7 rounded-3xl border border-slate-200 shadow-xs space-y-4 hover:border-[#02936C] transition group">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 group-hover:bg-blue-600 group-hover:text-white text-blue-600 flex items-center justify-center font-black text-xl transition">
                3
              </div>
              <h3 className="text-lg font-black text-[#03243F]">كشف إكسل وإشعار واتساب</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                حمّل شيت الإكسل الجاهز للسنتر بضغطة واحدة، وأرسل نتائج الطلاب مباشرة لأولياء أمورهم على واتساب برابط رسمي موثق.
              </p>
              <div className="text-[11px] font-bold text-[#02936C] flex items-center gap-1">
                <span>بنك أخطاء ذكي يُحفظ لكل طالب</span>
                <Check className="w-3.5 h-3.5" />
              </div>
            </div>

          </div>
        </section>

        {/* ========================================================
            5. تجربة حية تفاعلية لمفتاح الحل (Interactive Demo)
        ======================================================== */}
        <section id="interactive-demo" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-tr from-white via-slate-50 to-emerald-50/50 rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm space-y-8">
            
            <div className="text-center space-y-2 max-w-2xl mx-auto">
              <span className="text-xs font-bold text-[#02936C] bg-white border border-emerald-200 px-3 py-1 rounded-full shadow-2xs">
                💡 جرب السحر بنفسك الآن!
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[#03243F]">
                مفتاح الحل في سطر سريع.. اكتب وجرب المعاينة اللحظية
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                اكتب حروف الإجابات بالعربي أو الإنجليزي (مثل: ب أ ج د)، وشاهد كيف يحولها كَنترول لجدول نموذج إجابة فوري:
              </p>
            </div>

            <div className="max-w-2xl mx-auto space-y-4">
              <div className="relative">
                <input
                  type="text"
                  value={interactiveKey}
                  onChange={(e) => setInteractiveKey(e.target.value)}
                  placeholder="جرب اكتب: أ ب ج د ب أ ج د أو a b c d"
                  className="w-full text-base sm:text-lg font-bold p-4 pl-12 rounded-2xl border-2 border-[#02936C] focus:outline-none focus:ring-4 focus:ring-[#02936C]/20 text-center font-mono tracking-widest bg-white shadow-xs"
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold bg-emerald-100 text-[#02936C] px-2.5 py-1 rounded-xl">
                  {parsedKey.length} أسئلة
                </span>
              </div>

              {/* جدول المعاينة اللحظي */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <p className="text-xs font-bold text-slate-500 mb-2">المعاينة اللحظية لمفتاح الإجابة:</p>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {parsedKey.map((ans, idx) => (
                    <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-2 text-center space-y-1">
                      <span className="text-[10px] text-slate-400 block font-bold">سؤال {idx + 1}</span>
                      <span className="w-7 h-7 rounded-full bg-[#02936C] text-white font-black text-xs inline-flex items-center justify-center">
                        {ans}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ========================================================
            6. كل ما يحتاجه السنتر والمعلم في مكان واحد (Features)
        ======================================================== */}
        <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-4xl font-black text-[#03243F]">
              منظومة متكاملة.. تغنيك عن أي برامج أخرى
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              كل ميزة في كَنترول تم بناؤها بناءً على مشكلات حقيقية يواجهها معلمو الدروس الخصوصية والسناتر التعليمية في مصر.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Feature 1 */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#02936C] flex items-center justify-center font-bold">
                <ScanLine className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-[#03243F]">تصحيح بالكاميرا في نصف ثانية</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                لا تحتاج أجهزة سكانر باهظة الثمن؛ كاميرا موبايلك أو موبايل مساعدك قادرة على مسح ورقة البابل شيت ورصد الدرجات بدقة متناهية.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-[#03243F]">معلم ذكي لشرح الأخطاء (Gemini AI)</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                كل سؤال يخطئ فيه الطالب، يتولى الذكاء الاصطناعي الحقيقي شرحه له خطوة بخطوة وتوضيح الفخ الذي استدرجه والقاعدة الذهبية للحل.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-[#03243F]">توليد 4 نماذج لمنع الغش</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                أنشئ امتحاناً واحداً والمنصة تتكفل بتوليد 4 نماذج (أ، ب، ج، د) مع تبديل ذكي للأسئلة مع الحفاظ على ترابط القطع والمسائل.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-[#03243F]">حماية مشددة ضد الغش أونلاين</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                نظام أمني متطور يرصد مغادرة صفحة الامتحان أو التبديل بين التطبيقات، مع تحذير الطالب ورصد عدد مرات التبديل في تقرير المعلم.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
                <MessageCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-[#03243F]">تقارير واتساب لولي الأمر</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                رابط إلكتروني رسمي يصل لولي الأمر عبر واتساب مباشرة دون الحاجة لتحميل تطبيق أو تسجيل دخول؛ لمتابعة مستوى ابنه ودرجته وشهادة تقديره.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                <RefreshCw className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-[#03243F]">تعديل المفتاح بعد الامتحان</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                اكتشفت خطأ في سؤال أو أردت قبول إجابتين؟ عدّل المفتاح والمنصة تعيد تصحيح جميع أوراق ومحاولات الطلاب فوراً وتحديث النتائج تلقائياً.
              </p>
            </div>

          </div>
        </section>

        {/* ========================================================
            7. البوابات المخصصة (المعلم • الطالب • ولي الأمر)
        ======================================================== */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black text-[#03243F]">
              كل طرف له بوابته المصممة خصيصاً لاحتياجه
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">اختر دورك للدخول إلى بوابتك الخاصة:</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* بوابة المعلم */}
            <div className="bg-white rounded-3xl p-7 border-2 border-slate-200 hover:border-[#03243F] shadow-xs hover:shadow-lg transition space-y-5 flex flex-col justify-between">
              <div className="space-y-3">
                <span className="text-3xl">👨‍🏫</span>
                <h3 className="text-xl font-black text-[#03243F]">بوابة المعلم والسنتر</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  أنشئ امتحاناتك، راقب نتائج مجموعاتك وسناترك، طابق إجابات البابل شيت، وصدّر كشوف درجات الإكسل الرسمية.
                </p>
              </div>
              <button
                onClick={() => navigate('/teacher/login')}
                className="w-full bg-[#03243F] hover:bg-[#063154] text-white py-3 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                <span>دخول لوحة تحكم المعلم</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* بوابة الطالب */}
            <div className="bg-white rounded-3xl p-7 border-2 border-emerald-300 shadow-sm hover:shadow-lg transition space-y-5 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-[#02936C] text-white text-[10px] font-bold px-3 py-1 rounded-bl-2xl">
                بوابة مستقلة
              </div>
              <div className="space-y-3">
                <span className="text-3xl">🎓</span>
                <h3 className="text-xl font-black text-[#02936C]">بوابة الطالب المستقلة</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  حساب شخصي واحد يجمع كل امتحاناتك وواجباتك لدى جميع معلميك، مع بنك أخطاء تفاعلي وشرح الذكاء الاصطناعي للمراجعة.
                </p>
              </div>
              <button
                onClick={() => navigate('/student/login')}
                className="w-full bg-[#02936C] hover:bg-[#027d5c] text-white py-3 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                <span>دخول بوابة الطالب</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* بوابة ولي الأمر */}
            <div className="bg-white rounded-3xl p-7 border-2 border-slate-200 hover:border-slate-400 shadow-xs hover:shadow-lg transition space-y-5 flex flex-col justify-between">
              <div className="space-y-3">
                <span className="text-3xl">👨‍👩‍👧</span>
                <h3 className="text-xl font-black text-slate-800">تقارير أولياء الأمور</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  بدون كلمة مرور وبدون تسجيل دخول، يفتح ولي الأمر الرابط المستلم عبر واتساب مباشرة لمعرفة درجة ابنه ومستواه التفصيلي.
                </p>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-[11px] font-bold text-slate-500">
                يصل تلقائياً على واتساب بعد تصحيح الامتحان
              </div>
            </div>

          </div>
        </section>

        {/* ========================================================
            8. الدعوة الختامية للبدء (CTA Section)
        ======================================================== */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-l from-[#03243F] via-[#063154] to-[#02936C] p-8 sm:p-14 text-white text-center shadow-2xl border-4 border-white">
            <div className="max-w-2xl mx-auto space-y-5 relative z-10">
              <span className="bg-white/20 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-bold inline-block">
                🚀 ابدأ مع أكثر من مئات المعلمين في مصر
              </span>
              <h2 className="text-2xl sm:text-4xl font-black leading-tight">
                جاهز لتوفير وقتك وإبهار طلابك وأولياء أمورهم؟
              </h2>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed max-w-lg mx-auto">
                أنشئ حسابك الآن وابدأ بامتحان واحد لتجربة سرعة التصحيح ودقة الرصد وقوة الذكاء الاصطناعي بنفسك.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                <button
                  onClick={() => navigate('/teacher/login')}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-white hover:bg-slate-100 text-[#03243F] text-sm font-black shadow-lg transition hover:scale-105 flex items-center justify-center gap-2"
                >
                  <span>سجّل حساب معلم مجاناً</span>
                  <ArrowLeft className="w-4 h-4 text-[#02936C]" />
                </button>

                <button
                  onClick={() => navigate('/student/login')}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-sm font-bold transition flex items-center justify-center gap-2"
                >
                  <span>دخول الطلاب السريع</span>
                </button>
              </div>
            </div>

          </div>
        </section>

      </main>

      {/* ========================================================
          9. الفوتر الرسمي (Footer)
      ======================================================== */}
      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="كَنترول" className="h-8 w-auto object-contain" />
            <span>منصة كَنترول (Kontrol) • نظام الامتحانات والبابل شيت المتطور للسناتر المصرية</span>
          </div>

          <div className="flex items-center gap-4">
            <span>© {new Date().getFullYear()} جميع الحقوق محفوظة</span>
            <button
              onClick={() => navigate('/owner-portal')}
              className="text-slate-300 hover:text-slate-600 p-1.5 rounded-lg transition"
              title="لوحة الإدارة المركزية"
            >
              <Lock className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </footer>

    </div>
  );
}
