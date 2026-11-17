import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, Sparkles, ArrowRight, Phone, Lock, Hash } from 'lucide-react';
import { authAPI } from '../services/api';
import Logo from '../components/Logo';

export default function StudentLoginPage() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('01099887766');
  const [password, setPassword] = useState('123456');
  const [directExamCode, setDirectExamCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await authAPI.studentLogin({ phone, password });
      localStorage.setItem('student_token', res.data.token);
      localStorage.setItem('student_user', JSON.stringify(res.data.user));
      navigate('/student/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'رقم الهاتف غير مسجل لدى أي معلم أو كلمة المرور خاطئة');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async () => {
    setLoading(true);
    try {
      const res = await authAPI.studentLogin({ phone: '01099887766', password: '123456' });
      localStorage.setItem('student_token', res.data.token);
      localStorage.setItem('student_user', JSON.stringify(res.data.user));
      navigate('/student/dashboard');
    } catch (err) {
      setError('فشل الدخول التجريبي');
    } finally {
      setLoading(false);
    }
  };

  const handleDirectExamStart = (e) => {
    e.preventDefault();
    if (!directExamCode.trim()) return;
    navigate(`/student/exam/${directExamCode.trim().toUpperCase()}`);
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
          <h1 className="text-2xl font-black text-slate-900">تسجيل دخول الطالب</h1>
          <p className="text-xs text-slate-500 mt-1">
            تابع اختباراتك المفتوحة، درجاتك التراكمية، ومراجعة بنك أخطائك الشخصي
          </p>
        </div>

        {/* كارت الدخول السريع بكود الامتحان المباشر */}
        <form onSubmit={handleDirectExamStart} className="bg-teal-50/50 border border-teal-200 p-4 rounded-2xl space-y-2">
          <p className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
            <Hash className="w-4 h-4 text-teal-600" />
            معاك كود امتحان مباشر؟ أدخله هنا:
          </p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="مثال: PHY101"
              value={directExamCode}
              onChange={(e) => setDirectExamCode(e.target.value)}
              className="flex-1 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold uppercase focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
            <button
              type="submit"
              className="bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs"
            >
              ابدأ الحل
            </button>
          </div>
        </form>

        {/* زر التجربة السريعة الفورية */}
        <button
          type="button"
          onClick={handleQuickDemo}
          disabled={loading}
          className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white p-3 rounded-2xl text-xs font-bold shadow-md shadow-teal-500/20 flex items-center justify-center gap-2 transition hover:scale-[1.01]"
        >
          <Sparkles className="w-4 h-4" />
          <span>تجربة فورية بحساب الطالب التجريبي (محمد علي حسن)</span>
        </button>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
            {error}
          </div>
        )}

        {/* نموذج تسجيل الدخول بالهاتف */}
        <form onSubmit={handleLogin} className="space-y-4 border-t border-slate-100 pt-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              رقم هاتف الطالب أو ولي الأمر *
            </label>
            <input
              type="tel"
              placeholder="010XXXXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border border-slate-300 rounded-xl p-3 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none font-mono"
              required
            />
            <span className="text-[10px] text-slate-400 mt-1 block">الرقم الذي قام معلمك بتسجيلك به في المجموعة.</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">كلمة المرور (اختياري)</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-slate-300 rounded-xl p-3 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl text-xs shadow-md transition"
          >
            {loading ? 'جاري التحقق...' : 'دخول حسابي الدراسي 🚀'}
          </button>
        </form>

      </div>
    </div>
  );
}
