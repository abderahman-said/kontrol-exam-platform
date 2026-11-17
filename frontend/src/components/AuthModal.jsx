import React, { useState } from 'react';
import { X, Lock, Phone, User, Building, Sparkles } from 'lucide-react';
import { authAPI } from '../services/api';

export default function AuthModal({ isOpen, onClose, onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('01012345678');
  const [password, setPassword] = useState('123456');
  const [centerName, setCenterName] = useState('سنتر النور التعليمي');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let res;
      if (isRegister) {
        res = await authAPI.register({ name, phone, password, centerName });
      } else {
        res = await authAPI.login({ phone, password });
      }

      localStorage.setItem('teacher_token', res.data.token);
      onLoginSuccess(res.data.teacher);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'فشل تسجيل الدخول، تأكد من البيانات');
    } finally {
      setLoading(false);
    }
  };

  // زر الدخول التجريبي بنقرة واحدة
  const handleQuickDemoLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await authAPI.login({ phone: '01012345678', password: '123456' });
      localStorage.setItem('teacher_token', res.data.token);
      onLoginSuccess(res.data.teacher);
      onClose();
    } catch (err) {
      setError('فشل الدخول التجريبي');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative text-right">
        
        <button
          onClick={onClose}
          className="absolute top-5 left-5 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-extrabold text-slate-900 mb-1">
          {isRegister ? 'إنشاء حساب مدرس جديد' : 'تسجيل دخول المعلم'}
        </h2>
        <p className="text-xs text-slate-500 mb-5">
          {isRegister ? 'أنشئ حسابك لإدارة امتحاناتك وبابل شيت طلابك' : 'سجل الدخول للوصول للوحة التحكم والنتائج'}
        </p>

        {/* زر التجربة السريعة الفورية */}
        {!isRegister && (
          <button
            type="button"
            onClick={handleQuickDemoLogin}
            disabled={loading}
            className="w-full mb-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white p-3 rounded-2xl text-xs font-bold shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition hover:scale-[1.01]"
          >
            <Sparkles className="w-4 h-4" />
            <span>تجربة فورية بحساب المعلم التجريبي (أ. أحمد مصطفى)</span>
          </button>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isRegister && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم المعلم *</label>
                <input
                  type="text"
                  placeholder="أ. محمد أحمد"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم السنتر أو الأكاديمية</label>
                <input
                  type="text"
                  placeholder="سنتر الأوائل"
                  value={centerName}
                  onChange={(e) => setCenterName(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
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
              className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
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
              className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl text-xs shadow-md shadow-brand-500/25 transition mt-2"
          >
            {loading ? 'جاري التحميل...' : (isRegister ? 'تسجيل حساب جديد' : 'دخول لوحة التحكم')}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => setIsRegister(!isRegister)}
            className="text-xs text-brand-700 hover:underline font-bold"
          >
            {isRegister ? 'لديك حساب بالفعل؟ سجل الدخول هنا' : 'ليس لديك حساب؟ أنشئ حساب مدرس جديد'}
          </button>
        </div>

      </div>
    </div>
  );
}
