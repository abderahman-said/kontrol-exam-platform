import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, LogOut, ArrowRight } from 'lucide-react';
import Logo from '../components/Logo';
import AdminPortal from '../components/AdminPortal';

export default function AdminDashboardPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/admin/login');
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-cairo text-right">
      
      {/* Super Admin Dedicated Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo size="sm" variant="dark" />
            <span className="text-xs text-amber-400 bg-amber-400/10 border border-amber-400/30 px-2.5 py-1 rounded-xl font-bold hidden sm:inline-block">
              إدارة المنصة (خاصة بك فقط)
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3.5 py-2 rounded-xl transition border border-slate-700"
          >
            <LogOut className="w-4 h-4" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdminPortal />
      </main>

    </div>
  );
}
