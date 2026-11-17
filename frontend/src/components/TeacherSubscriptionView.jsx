import React, { useState, useEffect } from 'react';
import { 
  CreditCard, CheckCircle2, ShieldCheck, Zap, 
  Smartphone, Calendar, ArrowRight, DollarSign, Clock, AlertTriangle, TrendingUp, Sparkles, Copy, Check, Users, ShieldAlert, PlusCircle
} from 'lucide-react';
import { subscriptionAPI } from '../services/api';

export default function TeacherSubscriptionView({ onBack }) {
  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('INSTAPAY');
  const [transactionRef, setTransactionRef] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState('');
  
  // شحن رصيد الطلاب
  const [rechargeCount, setRechargeCount] = useState(30);

  // تعديل اشتراك الطالب المحدد من قِبل المعلم (بحد أقصى 200 ج.م)
  const [customPriceInput, setCustomPriceInput] = useState('50');
  const [savingPrice, setSavingPrice] = useState(false);
  const [priceError, setPriceError] = useState('');
  const [priceSuccess, setPriceSuccess] = useState('');

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      setLoading(true);
      const res = await subscriptionAPI.get();
      const s = res.data.subscription;
      setSub(s);
      setCustomPriceInput(String(s.studentSubscriptionFee || 50));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedAccount(key);
    setTimeout(() => setCopiedAccount(''), 2000);
  };

  // شحن رصيد طلاب إضافي بعد تحويل العمولة مقدماً
  const handlePay = async (e) => {
    e.preventDefault();
    if (!transactionRef.trim()) {
      alert('يرجى إدخال رقم المعاملة في انستاباي أو رقم المحفظة المحول منها');
      return;
    }
    if (!rechargeCount || rechargeCount < 1) {
      alert('يرجى تحديد عدد طلاب صالح للشحن');
      return;
    }
    setSubmitting(true);
    try {
      const res = await subscriptionAPI.pay({
        paymentMethod,
        transactionRef,
        studentCount: rechargeCount
      });
      alert(res.data?.message || `تم شحن رصيد ${rechargeCount} طالب بنجاح! 🚀`);
      setTransactionRef('');
      await loadSubscription();
    } catch (err) {
      alert(err.response?.data?.error || 'فشل تسجيل عملية التحويل');
    } finally {
      setSubmitting(false);
    }
  };

  // حفظ اشتراك الطالب الشهري المخصص (بحد أقصى 200 ج.م)
  const handleSavePrice = async (e) => {
    if (e) e.preventDefault();
    setPriceError('');
    setPriceSuccess('');

    const val = parseFloat(customPriceInput);
    if (isNaN(val) || val < 10) {
      setPriceError('أقل قيمة لاشتراك الطالب هي 10 جنيهات');
      return;
    }
    if (val > 200) {
      setPriceError('الحد الأقصى لاشتراك الطالب هو 200 جنيه مصري شهرياً');
      return;
    }

    try {
      setSavingPrice(true);
      const res = await subscriptionAPI.updatePricing({ pricePerStudent: val });
      setPriceSuccess(res.data?.message || 'تم تحديث سعر اشتراك الطالب بنجاح');
      await loadSubscription();
      setTimeout(() => setPriceSuccess(''), 3500);
    } catch (err) {
      setPriceError(err.response?.data?.error || 'فشل تحديث السعر');
    } finally {
      setSavingPrice(false);
    }
  };

  const applyPresetPrice = (preset) => {
    setCustomPriceInput(String(preset));
    setPriceError('');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4 font-cairo">
        <div className="w-10 h-10 border-4 border-[#02936C] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-black text-[#03243F]">جاري تحميل بيانات الرصيد واشتراكات الطلاب...</p>
      </div>
    );
  }

  if (!sub) return null;

  // الحسابات الفورية
  const commissionPerStudent = sub.platformCommissionPerStudent || ((sub.studentSubscriptionFee || 50) * 0.10);
  const totalCommissionToPay = Math.round(rechargeCount * commissionPerStudent);
  const totalTeacherRevenueFromRecharge = Math.round(rechargeCount * (sub.studentSubscriptionFee || 50));
  const netTeacherEarningsFromRecharge = totalTeacherRevenueFromRecharge - totalCommissionToPay;

  // نسبة استهلاك الكوتة
  const quotaUsedPercent = sub.studentLimit > 0 
    ? Math.min(100, Math.round((sub.activeStudentsCount / sub.studentLimit) * 100))
    : 100;

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-right pb-16 font-cairo selection:bg-[#02936C] selection:text-white">
      
      {/* Sleek Breadcrumb & Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-slate-600 hover:text-[#02936C] bg-slate-50 hover:bg-emerald-50 border border-slate-200/80 hover:border-emerald-200 px-3 py-1.5 rounded-xl transition font-black"
          >
            <ArrowRight className="w-3.5 h-3.5 text-[#02936C]" />
            <span>العودة للامتحانات</span>
          </button>
          <span className="text-slate-300">/</span>
          <span className="text-[#03243F] font-black">إدارة الاشتراك ورصيد الأكواد</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs bg-emerald-50 text-[#02936C] font-black px-3 py-1.5 rounded-xl border border-emerald-200/90 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#02936C]" />
            <span>نظام شحن الأكواد المسبق (عمولة 10% فقط)</span>
          </span>
        </div>
      </div>

      {/* Main Banner */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-l from-[#03243F] via-[#063154] to-[#02936C] p-6 sm:p-8 text-white shadow-xl border-2 border-white/20 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="relative z-10 space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="bg-white/20 px-3 py-0.5 rounded-full text-xs font-black inline-block text-emerald-200 border border-white/20">
              {sub.status === 'ACTIVE' ? '✅ حساب المعلم نشط' : '⏳ فترة تجريبية مفعّلة'}
            </span>
            <span className="bg-emerald-500/30 text-white text-[11px] px-2.5 py-0.5 rounded-full font-bold">
              أنت تحتفظ بـ 90% والمنصة 10% فقط
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black leading-tight">
            نظام رصيد الأكواد لضمان أرباحك وعمولة المنصة
          </h1>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
            الطالب يدفع لك الاشتراك مباشرة (كاش في يدك أو تحويل على محفظتك). ولكل طالب كود فريد يُحرق فور الاستخدام لمنع مشاركته. تشحن رصيد الطلاب بتحويل نسبة المنصة (10% مقدماً عبر انستاباي أو فودافون كاش) لتضيف الطلاب وتصدر أكوادهم فوراً.
          </p>
        </div>

        {/* سعة الطلاب الحالية */}
        <div className="relative z-10 bg-white/10 backdrop-blur-md p-5 rounded-3xl border border-white/20 text-center shrink-0 min-w-[210px] space-y-1">
          <p className="text-xs text-emerald-200 font-bold">الأكواد المتاحة للإضافة حالياً</p>
          <p className="text-3xl font-black text-white">{sub.availableStudentQuota} <span className="text-sm font-normal">طالب</span></p>
          <span className="text-[11px] text-emerald-200 font-bold block pt-1">
            من إجمالي سعة مشحونة: {sub.studentLimit} طالب
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* بطاقة رصيد وسعة الطلاب المشحونة (Student Quota Stats) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-black text-[#03243F] flex items-center gap-2">
              <Users className="w-4 h-4 text-[#02936C]" />
              <span>متابعة رصيد وسعة الطلاب المشحونة</span>
            </h2>
            <p className="text-xs text-slate-500 font-bold mt-0.5">
              كل طالب تضيفه يستهلك كوداً واحداً من رصيدك المشحون لمنع أي تكرار
            </p>
          </div>
          <span className={`text-xs font-black px-3 py-1 rounded-full border ${
            sub.availableStudentQuota === 0 
              ? 'bg-rose-50 text-rose-600 border-rose-200' 
              : sub.availableStudentQuota < 5 
                ? 'bg-amber-50 text-amber-600 border-amber-200' 
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}>
            {sub.availableStudentQuota === 0 
              ? '⚠️ نفد رصيد الطلاب - اشحن الآن' 
              : `متبقي ${sub.availableStudentQuota} مكان شاغر`}
          </span>
        </div>

        {/* شريط الاستهلاك */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-black text-slate-600">
            <span>الطلاب المسجلين: {sub.activeStudentsCount} طالب</span>
            <span>إجمالي السعة المشحونة: {sub.studentLimit} طالب</span>
          </div>
          <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden p-0.5 border border-slate-200">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                quotaUsedPercent >= 90 ? 'bg-rose-500' : quotaUsedPercent >= 70 ? 'bg-amber-500' : 'bg-[#02936C]'
              }`}
              style={{ width: `${quotaUsedPercent}%` }}
            ></div>
          </div>
        </div>

        {/* الكروت الثلاثة */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
            <p className="text-[11px] font-bold text-slate-500">إجمالي سعة الطلاب</p>
            <p className="text-xl font-black text-[#03243F] mt-1">{sub.studentLimit} <span className="text-xs font-normal">طالب</span></p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
            <p className="text-[11px] font-bold text-slate-500">الطلاب النشطين حالياً</p>
            <p className="text-xl font-black text-[#03243F] mt-1">{sub.activeStudentsCount} <span className="text-xs font-normal">طالب</span></p>
          </div>
          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 text-center">
            <p className="text-[11px] font-black text-[#02936C]">الأكواد الشاغرة المتبقية</p>
            <p className="text-xl font-black text-[#02936C] mt-1">{sub.availableStudentQuota} <span className="text-xs font-normal">كود متاح</span></p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* تحديد سعر اشتراك الطالب المحدد من قِبل المعلم (بحد أقصى 200 ج.م) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
        <div>
          <h2 className="text-sm font-black text-[#03243F] flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-[#02936C]" />
            <span>تحديد سعر اشتراك الطالب الشهري (بحد أقصى 200 ج.م)</span>
          </h2>
          <p className="text-xs text-slate-500 font-bold mt-0.5">
            أدخل القيمة التي تحصّلها أنت من طلابك شهرياً. المنصة تحتسب عمولتها (10% فقط) بناءً على هذه القيمة.
          </p>
        </div>

        {/* إدخال القيمة + الأزرار السريعة */}
        <div className="space-y-3">
          <form onSubmit={handleSavePrice} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <input
                type="number"
                min="10"
                max="200"
                step="5"
                value={customPriceInput}
                onChange={(e) => {
                  setCustomPriceInput(e.target.value);
                  setPriceError('');
                }}
                placeholder="أدخل اشتراك الطالب (10 - 200 ج.م)"
                className="w-full border-2 border-slate-200 rounded-2xl p-3 text-sm font-black text-[#03243F] focus:border-[#02936C] focus:ring-2 focus:ring-[#02936C]/20 focus:outline-none pl-12"
              />
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                ج.م / شهر
              </span>
            </div>

            <button
              type="submit"
              disabled={savingPrice}
              className="bg-[#02936C] hover:bg-[#027d5c] text-white px-6 py-3 rounded-2xl text-xs font-black shadow-md shadow-[#02936C]/20 transition flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{savingPrice ? 'جاري الحفظ...' : 'حفظ وتثبيت السعر'}</span>
            </button>
          </form>

          {/* أزرار سريعة للاختيار المباشر */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-bold text-slate-400">أو اختر تسعيراً شائعاً:</span>
            {[50, 75, 100, 150, 200].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => applyPresetPrice(preset)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition border ${
                  parseFloat(customPriceInput) === preset
                    ? 'bg-[#03243F] text-white border-[#03243F] shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {preset} ج.م
              </button>
            ))}
          </div>

          {/* رسائل التنبيه والنجاح */}
          {priceError && (
            <p className="text-xs font-bold text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{priceError}</span>
            </p>
          )}
          {priceSuccess && (
            <p className="text-xs font-bold text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 flex items-center gap-1.5">
              <Check className="w-4 h-4 shrink-0" />
              <span>{priceSuccess}</span>
            </p>
          )}

          {/* بطاقة الشفافية وتوزيع الحصص لكل طالب */}
          {parseFloat(customPriceInput) >= 10 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
              <div>
                <p className="text-slate-500 font-bold">اشتراك الطالب المحصّل:</p>
                <p className="text-base font-black text-[#03243F] mt-0.5">{parseFloat(customPriceInput) || 0} ج.م</p>
              </div>
              <div className="border-r border-slate-200 pr-3">
                <p className="text-[#02936C] font-black">أرباحك الصافية (90%):</p>
                <p className="text-base font-black text-[#02936C] mt-0.5">
                  {((parseFloat(customPriceInput) || 0) * 0.90).toFixed(1)} ج.م
                </p>
              </div>
              <div className="border-r border-slate-200 pr-3">
                <p className="text-purple-700 font-black">عمولة المنصة (10%):</p>
                <p className="text-base font-black text-purple-800 mt-0.5">
                  {((parseFloat(customPriceInput) || 0) * 0.10).toFixed(1)} ج.م فقط
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* شحن رصيد أكواد إضافية وتحويل عمولة المنصة (10% مقدماً) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-[#02936C]" />
            <h2 className="text-base font-black text-[#03243F]">
              شحن رصيد أكواد طلاب جديدة (تحويل عمولة 10% مقدماً)
            </h2>
          </div>
          <p className="text-xs text-slate-500 font-bold mt-1">
            حدد عدد الطلاب الذين تريد شحن أكواد لهم، وحوّل عمولة المنصة فقط ({commissionPerStudent} ج.م عن كل طالب) عبر انستاباي أو فودافون كاش
          </p>
        </div>

        {/* حاسبة شحن الطلاب */}
        <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/80 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <label className="text-xs font-black text-slate-700">كم طالباً تريد شحن رصيد لهم؟</label>
            <div className="flex items-center gap-1.5">
              {[15, 30, 50, 100].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setRechargeCount(num)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition border ${
                    rechargeCount === num 
                      ? 'bg-[#02936C] text-white border-[#02936C] shadow-xs' 
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  +{num} طالب
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="number"
              min="1"
              max="500"
              value={rechargeCount}
              onChange={(e) => setRechargeCount(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-32 border-2 border-slate-200 rounded-xl p-2.5 text-center text-sm font-black text-[#03243F] bg-white focus:border-[#02936C] focus:outline-none"
            />
            <span className="text-xs font-black text-slate-600">طالب</span>
          </div>

          {/* ملخص الحسبة الذكية */}
          <div className="p-4 rounded-xl bg-white border border-emerald-100 text-xs space-y-2">
            <div className="flex justify-between items-center text-slate-600 font-bold">
              <span>إجمالي ما ستحصله أنت من هؤلاء الطلاب (100%):</span>
              <span className="font-black text-[#03243F] text-sm">{totalTeacherRevenueFromRecharge} ج.م</span>
            </div>
            <div className="flex justify-between items-center text-[#02936C] font-bold">
              <span>أرباحك الصافية المتبقية معك كمعلم (90%):</span>
              <span className="font-black text-sm">{netTeacherEarningsFromRecharge} ج.م</span>
            </div>
            <div className="border-t border-slate-100 pt-2 flex justify-between items-center text-purple-900 font-black">
              <span>عمولة المنصة المطلوبة مقدماً لشحن الأكواد (10%):</span>
              <span className="text-base text-purple-700 bg-purple-50 px-3 py-1 rounded-lg border border-purple-200">
                {totalCommissionToPay} ج.م فقط
              </span>
            </div>
          </div>
        </div>

        {/* بيانات المحافظ المعتمدة */}
        <div className="space-y-3">
          <label className="text-xs font-black text-slate-700 block">اختر وسيلة التحويل لحساب المنصة:</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* انستاباي */}
            <div 
              className={`p-4 rounded-2xl border-2 transition cursor-pointer ${
                paymentMethod === 'INSTAPAY' 
                  ? 'border-[#02936C] bg-emerald-50/40 shadow-xs' 
                  : 'border-slate-200 bg-slate-50 hover:border-slate-300'
              }`} 
              onClick={() => setPaymentMethod('INSTAPAY')}
            >
              <div className="flex items-center gap-3 mb-2.5">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-base shrink-0">
                  ⚡
                </div>
                <div>
                  <p className="text-xs font-black text-[#03243F]">انستاباي (InstaPay)</p>
                  <span className="text-[10px] text-slate-400 font-bold">تحويل فوري بدون أي مصاريف إضافية</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200 text-xs font-mono font-black text-purple-800">
                <span>kontrol@instapay</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopy('kontrol@instapay', 'instapay');
                  }}
                  className="p-1 hover:text-purple-600 transition flex items-center gap-1 text-[11px]"
                >
                  {copiedAccount === 'instapay' ? (
                    <span className="text-emerald-600 font-sans font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> تم النسخ
                    </span>
                  ) : (
                    <span className="text-slate-400 font-sans flex items-center gap-1">
                      <Copy className="w-3.5 h-3.5" /> نسخ
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* فودافون كاش */}
            <div 
              className={`p-4 rounded-2xl border-2 transition cursor-pointer ${
                paymentMethod === 'VODAFONE_CASH' 
                  ? 'border-[#02936C] bg-emerald-50/40 shadow-xs' 
                  : 'border-slate-200 bg-slate-50 hover:border-slate-300'
              }`} 
              onClick={() => setPaymentMethod('VODAFONE_CASH')}
            >
              <div className="flex items-center gap-3 mb-2.5">
                <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center font-bold text-base shrink-0">
                  📱
                </div>
                <div>
                  <p className="text-xs font-black text-[#03243F]">فودافون كاش (Vodafone Cash)</p>
                  <span className="text-[10px] text-slate-400 font-bold">من أي محفظة إلكترونية بمصر</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200 text-xs font-mono font-black text-red-800">
                <span>01099887766</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopy('01099887766', 'vodafone');
                  }}
                  className="p-1 hover:text-red-600 transition flex items-center gap-1 text-[11px]"
                >
                  {copiedAccount === 'vodafone' ? (
                    <span className="text-emerald-600 font-sans font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> تم النسخ
                    </span>
                  ) : (
                    <span className="text-slate-400 font-sans flex items-center gap-1">
                      <Copy className="w-3.5 h-3.5" /> نسخ
                    </span>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* نموذج تسجيل التحويل */}
        <form onSubmit={handlePay} className="border-t border-slate-100 pt-5 space-y-4">
          <div>
            <label className="block text-xs font-black text-slate-700 mb-1.5">
              رقم العملية في انستاباي أو رقم المحفظة المحول منها *
            </label>
            <input
              type="text"
              placeholder="مثال: رقم العملية البنكية أو 010XXXXXXXX"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-3 text-xs font-bold focus:border-[#02936C] focus:ring-2 focus:ring-[#02936C]/20 focus:outline-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#02936C] hover:bg-[#027d5c] text-white font-black py-3.5 rounded-2xl text-xs shadow-md shadow-[#02936C]/20 transition flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {submitting 
                ? 'جاري تأكيد الشحن...' 
                : `تأكيد تحويل (${totalCommissionToPay} ج.م) وشحن رصيد ${rechargeCount} طالب 🚀`}
            </span>
          </button>
        </form>

        {/* حماية الأكواد ومكافحة التلاعب */}
        <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200/80 flex items-start gap-3 text-xs text-amber-900 leading-relaxed font-bold">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-black text-amber-950 mb-0.5">ضمان حماية حقوقك وحقوق المنصة بالأكواد الفردية:</p>
            <p>
              الأكواد الصادرة في المنصة مشفرة ومخصصة استخدام مرة واحدة (Single-use)؛ فور دخول الطالب للامتحان يُربط الكود باسمه ويُحرق في قاعدة البيانات تلقائياً، ويمنع النظام تماماً دخول أي طالب ثانٍ بنفس الكود.
            </p>
          </div>
        </div>

      </div>

      {/* سجل التحويلات السابقة */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs">
        <h3 className="text-sm font-black text-[#03243F] mb-3">سجل عمليات الشحن والتحويلات السابقة</h3>
        {sub.invoices && sub.invoices.length > 0 ? (
          <div className="space-y-2">
            {sub.invoices.map((inv) => (
              <div key={inv.id} className="p-3.5 bg-slate-50 rounded-2xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-emerald-100 text-[#02936C] flex items-center justify-center font-bold">✓</span>
                  <div>
                    <p className="font-bold text-[#03243F]">
                      {inv.amount} ج.م - شحن رصيد ({inv.studentCount || 30} طالب)
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {inv.paymentMethod} • مرجع: {inv.transactionRef}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] text-slate-400 font-bold">
                  {new Date(inv.createdAt).toLocaleDateString('ar-EG')}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 text-center py-4 font-bold">لا توجد عمليات شحن سابقة مسجلة حتى الآن.</p>
        )}
      </div>

    </div>
  );
}
