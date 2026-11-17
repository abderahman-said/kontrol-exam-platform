import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Sparkles, ArrowRight, Mail, Lock } from 'lucide-react';
import { authAPI } from '../services/api';
import Logo from '../components/Logo';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@kontrol.eg');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await authAPI.adminLogin({ email, password });
      localStorage.setItem('admin_token', res.data.token);
      localStorage.setItem('admin_user', JSON.stringify(res.data.user));
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'بيانات دخول مسؤول المنصة غير صحيحة');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async () => {
    setLoading(true);
    try {
      const res = await authAPI.adminLogin({ email: 'admin@kontrol.eg', password: 'admin123' });
      localStorage.setItem('admin_token', res.data.token);
      localStorage.setItem('admin_user', JSON.stringify(res.data.user));
      navigate('/admin/dashboard');
    } catch (err) {
      setError('فشل دخول الأدمن التجريبي');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-cairo text-right text-white">
      <div className="max-w-md w-full bg-slate-800/90 rounded-3xl p-6 sm:p-8 border border-slate-700 shadow-2xl space-y-6 backdrop-blur-md">
        
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition"
          >
            <ArrowRight className="w-4 h-4" />
            الرئيسية
          </button>
          <Logo size="sm" variant="dark" />
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold text-amber-400 bg-amber-400/10 border border-amber-400/30 px-3 py-1 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              إدارة المنصة (SaaS Admin)
            </span>
          </div>
          <h1 className="text-2xl font-black text-white">تسجيل دخول مسؤول المنصة</h1>
          <p className="text-xs text-slate-400 mt-1">
            لوحة الإدارة المركزية لمتابعة اشتراكات المدرسين وإيرادات كَنترول
          </p>
        </div>

        {/* زر الدخول السريع الفوري */}
        <button
          type="button"
          onClick={handleQuickDemo}
          disabled={loading}
          className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 p-3 rounded-2xl text-xs font-black shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition hover:scale-[1.01]"
        >
          <Sparkles className="w-4 h-4" />
          <span>دخول فوري بحساب الأدمن (admin@kontrol.eg)</span>
        </button>

        {error && (
          <div className="p-3 bg-red-950/60 border border-red-800 rounded-xl text-red-200 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">البريد الإلكتروني للإدارة *</label>
            <input
              type="email"
              placeholder="admin@kontrol.eg"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">كلمة المرور *</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-400 hover:bg-amber-500 text-slate-950 font-black py-3.5 rounded-xl text-xs shadow-md transition"
          >
            {loading ? 'جاري التحقق...' : 'دخول لوحة التحكم 👑'}
          </button>
        </form>

      </div>
    </div>
  );
}
