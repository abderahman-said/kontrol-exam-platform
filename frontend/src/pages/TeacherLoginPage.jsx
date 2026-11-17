import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Sparkles, ArrowRight, Phone, Lock, Building, User } from 'lucide-react';
import { authAPI } from '../services/api';
import Logo from '../components/Logo';

export default function TeacherLoginPage() {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('01012345678');
  const [password, setPassword] = useState('123456');
  const [centerName, setCenterName] = useState('سنتر النور التعليمي');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let res;
      if (isRegister) {
        res = await authAPI.teacherRegister({ name, phone, password, centerName });
      } else {
        res = await authAPI.teacherLogin({ phone, password });
      }

      localStorage.setItem('teacher_token', res.data.token);
      localStorage.setItem('teacher_user', JSON.stringify(res.data.user));
      navigate('/teacher/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'بيانات الدخول غير صحيحة');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async () => {
    setLoading(true);
    try {
      const res = await authAPI.teacherLogin({ phone: '01012345678', password: '123456' });
      localStorage.setItem('teacher_token', res.data.token);
      localStorage.setItem('teacher_user', JSON.stringify(res.data.user));
      navigate('/teacher/dashboard');
    } catch (err) {
      setError('فشل الدخول التجريبي');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-cairo text-right">
      <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
        
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-700 transition"
          >
            <ArrowRight className="w-4 h-4" />
            الرئيسية
          </button>
          <Logo size="sm" />
        </div>

        <div>
          <h1 className="text-2xl font-black text-slate-900">
            {isRegister ? 'تسجيل معلم أو سنتر جديد' : 'تسجيل دخول المعلم'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isRegister ? 'أنشئ حسابك لإدارة طلابك وبابل شيت مذكراتك' : 'أدخل بياناتك للوصول للوحة الامتحانات والنتائج'}
          </p>
        </div>

        {/* زر التجربة السريعة الفورية */}
        {!isRegister && (
          <button
            type="button"
            onClick={handleQuickDemo}
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white p-3 rounded-2xl text-xs font-bold shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition hover:scale-[1.01]"
          >
            <Sparkles className="w-4 h-4" />
            <span>تجربة فورية بحساب المعلم التجريبي (أ. أحمد مصطفى)</span>
          </button>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم المعلم *</label>
                <input
                  type="text"
                  placeholder="أ. محمد أحمد"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-3 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم السنتر أو الأكاديمية</label>
                <input
                  type="text"
                  placeholder="مثال: سنتر الأوائل"
                  value={centerName}
                  onChange={(e) => setCenterName(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-3 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">رقم الموبايل *</label>
            <input
              type="tel"
              placeholder="010XXXXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border border-slate-300 rounded-xl p-3 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">كلمة المرور *</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-slate-300 rounded-xl p-3 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 rounded-xl text-xs shadow-md shadow-brand-500/20 transition"
          >
            {loading ? 'جاري التحميل...' : (isRegister ? 'إنشاء حساب وبدء الاستخدام' : 'دخول لوحة المعلم')}
          </button>
        </form>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => setIsRegister(!isRegister)}
            className="text-xs text-brand-700 hover:underline font-bold"
          >
            {isRegister ? 'لديك حساب مسجل بالفعل؟ اضغط هنا للدخول' : 'ليس لديك حساب؟ سجل كمعلم جديد الآن'}
          </button>
        </div>

      </div>
    </div>
  );
}
