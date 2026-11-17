import React, { useState, useEffect } from 'react';
import { 
  DollarSign, Users, Award, BookOpen, ShieldCheck, 
  CheckCircle, Clock, AlertCircle, RefreshCw, Smartphone, TrendingUp, Sparkles, Percent
} from 'lucide-react';
import { adminAPI } from '../services/api';

export default function AdminPortal() {
  const [stats, setStats] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, teachersRes, paymentsRes] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getTeachers(),
        adminAPI.getPayments()
      ]);
      setStats(statsRes.data.stats);
      setTeachers(teachersRes.data.teachers || []);
      setPayments(paymentsRes.data.payments || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePayment = async (paymentId) => {
    try {
      await adminAPI.updatePaymentStatus(paymentId, 'APPROVED');
      alert('تم اعتماد تحويل العمولة وتمديد حساب المعلم بنجاح! ✅');
      loadAdminData();
    } catch (err) {
      alert('فشل اعتماد التحويل');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-bold text-slate-600">جاري تحميل بيانات الأرباح والعمولات...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-right pb-12">
      
      {/* SaaS Admin Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-amber-400 text-slate-950 text-xs font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              لوحة تحكم صاحب المشروع (خاصة بك فقط)
            </span>
            <span className="text-xs text-amber-200/80">نموذج عمولة 10% لكل طالب عبر انستاباي وفودافون كاش</span>
          </div>
          <h1 className="text-2xl font-black">أرباح وعمولات المنصة (10% Share)</h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
            المنصة تحصل على <strong>10% عمولة صافية عن كل طالب (5 ج.م)</strong> من اشتراك الـ 50 ج.م، والمعلم يحتفظ بـ 90% (45 ج.م). يتم التحويل المباشر لمحفظتك أو حساب انستاباي بدون أي وسيط بنكي خارجي.
          </p>
        </div>

        <button
          onClick={loadAdminData}
          className="bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 shrink-0 border border-white/10"
        >
          <RefreshCw className="w-4 h-4" />
          تحديث الأرقام
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* عمولة المنصة الشهرية المتوقعة (10%) */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold text-slate-600">عمولتك الشهرية المتوقعة (10%)</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600">
            {stats?.expectedMonthlyCommissionEGP?.toLocaleString()} <span className="text-xs font-bold text-slate-400">ج.م/شهر</span>
          </p>
          <span className="text-[11px] text-slate-500 font-medium mt-1 block">
            أرباحك الصافية (5 ج.م × {stats?.totalStudents || 0} طالب)
          </span>
        </div>

        {/* إجمالي حجم التداول المالي عبر المنصة (GMV) */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold text-slate-600">إجمالي دخل المدرسين (GMV)</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">
            {stats?.grossMarketVolumeEGP?.toLocaleString()} <span className="text-xs font-bold text-slate-400">ج.م</span>
          </p>
          <span className="text-[11px] text-slate-400 font-medium mt-1 block">
            إجمالي اشتراكات الطلاب لدى المدرسين (100%)
          </span>
        </div>

        {/* إجمالي العمولات المحصلة فعلياً */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold text-slate-600">العمولات المحصلة كاش</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600">
            {stats?.totalCollectedCommissionEGP?.toLocaleString()} <span className="text-xs font-bold text-slate-400">ج.م</span>
          </p>
          <div className="flex items-center justify-between text-[11px] mt-1">
            <span className="text-emerald-700 font-medium">معتمدة ومحصلة</span>
            {stats?.pendingCommissionEGP > 0 && (
              <span className="text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                قيد المراجعة: {stats.pendingCommissionEGP} ج.م
              </span>
            )}
          </div>
        </div>

        {/* المعلمون والطلاب النشطين */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold text-slate-600">المعلمون والطلاب</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">
            {stats?.totalTeachers} <span className="text-xs text-slate-400 font-normal">معلم</span> • {stats?.totalStudents} <span className="text-xs text-slate-400 font-normal">طالب</span>
          </p>
          <span className="text-[11px] text-slate-400 font-medium mt-1 block">
            في {stats?.totalExams} امتحان منشور
          </span>
        </div>

      </div>

      {/* جدول المعلمين وحساب نسبة الـ 10% */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">المعلمون والسناتر المشتركة ({teachers.length})</h2>
            <p className="text-xs text-slate-400">كشف الطلاب، إجمالي المحصل، وعمولة المنصة المستحقة (10%)</p>
          </div>
          <span className="text-xs bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1 rounded-xl font-bold">
            نسبتك: 10% (5 ج.م / طالب)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <th className="p-4">المعلم والسنتر</th>
                <th className="p-4">رقم الموبايل</th>
                <th className="p-4">عدد الطلاب</th>
                <th className="p-4">إجمالي دخل المدرس (100%)</th>
                <th className="p-4">أرباح المدرس الصافية (90%)</th>
                <th className="p-4">عمولة المنصة الواجبة (10%)</th>
                <th className="p-4">حالة الحساب</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {teachers.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-4 font-bold text-slate-900">
                    <p className="text-xs">{t.name}</p>
                    <span className="text-[10px] text-slate-400 font-normal">{t.centerName || 'مدرس مستقل'}</span>
                  </td>
                  <td className="p-4 font-mono text-slate-700">{t.phone}</td>
                  <td className="p-4 font-bold text-slate-900">
                    <span className="bg-brand-50 text-brand-700 border border-brand-200 px-2.5 py-0.5 rounded-lg">
                      {t.studentCount} طالب
                    </span>
                  </td>
                  <td className="p-4 font-bold text-slate-800">
                    {t.totalCollectedFromStudents?.toLocaleString()} ج.م
                  </td>
                  <td className="p-4 font-bold text-emerald-700">
                    {t.teacherShare?.toLocaleString()} ج.م
                  </td>
                  <td className="p-4 font-black text-amber-600 text-sm">
                    {t.platformDueCommission?.toLocaleString()} ج.م
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      t.subscriptionStatus === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {t.subscriptionStatus === 'ACTIVE' ? 'نشط ومسدد' : 'فترة تجريبية'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* جدول التحويلات الواردة عبر انستاباي وفودافون كاش */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">سجل تحويلات العمولات المباشرة (انستاباي / فودافون كاش)</h2>
            <p className="text-xs text-slate-400">تحويلات المدرسين المباشرة لمحفظتك أو حساب انستاباي</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <th className="p-4">المعلم</th>
                <th className="p-4">قيمة العمولة (10%)</th>
                <th className="p-4">طريقة التحويل</th>
                <th className="p-4">رقم المعاملة / المحفظة</th>
                <th className="p-4">الحالة</th>
                <th className="p-4 text-center">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-4 font-bold text-slate-900">
                    {p.teacher?.name}
                    <span className="block text-[10px] text-slate-400">{p.teacher?.phone}</span>
                  </td>
                  <td className="p-4 font-black text-amber-600 text-sm">
                    {p.amount} ج.م
                    <span className="block text-[10px] text-slate-400 font-normal">عن {p.studentCount} طالب</span>
                  </td>
                  <td className="p-4">
                    <span className="font-semibold text-slate-700">
                      {p.paymentMethod === 'INSTAPAY' ? '⚡ انستاباي' : '📱 فودافون كاش'}
                    </span>
                  </td>
                  <td className="p-4 font-mono text-slate-500 text-[11px]">{p.transactionRef || '-'}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      p.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {p.status === 'APPROVED' ? 'معتمد ومحسوب' : 'قيد المراجعة'}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    {p.status !== 'APPROVED' ? (
                      <button
                        onClick={() => handleApprovePayment(p.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl font-bold text-[11px] transition shadow-xs"
                      >
                        اعتماد وتفعيل
                      </button>
                    ) : (
                      <span className="text-emerald-600 font-bold text-[11px]">تم التأكيد ✓</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
