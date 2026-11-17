import React from 'react';
import { 
  BookOpen, Users, LogOut, UserCheck, ShieldCheck, 
  PlusCircle, CreditCard, Sparkles, GraduationCap 
} from 'lucide-react';
import Logo from './Logo';

export default function Navbar({ 
  roleMode, // 'TEACHER' | 'STUDENT' | 'ADMIN'
  setRoleMode,
  activeTab, 
  setActiveTab, 
  teacher, 
  student,
  onLogout, 
  onOpenNewExam, 
  onOpenAuth 
}) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <Logo size="sm" />

          {/* SaaS Portal Selector (3 الأدوار الأساسية) */}
          <div className="flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200/80">
            
            {/* 1. بوابة المعلم والسنتر */}
            <button
              onClick={() => {
                setRoleMode('TEACHER');
                setActiveTab('exams');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                roleMode === 'TEACHER'
                  ? 'bg-white text-brand-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>👨‍🏫</span>
              <span>المعلم</span>
            </button>

            {/* 2. حساب الطالب الخاص */}
            <button
              onClick={() => {
                setRoleMode('STUDENT');
                setActiveTab('student-dash');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                roleMode === 'STUDENT'
                  ? 'bg-white text-brand-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>🎓</span>
              <span>الطالب</span>
            </button>

            {/* 3. تقرير ولي الأمر والشهادات */}
            <button
              onClick={() => {
                setRoleMode('PARENT');
                setActiveTab('parent-report');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                roleMode === 'PARENT'
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>👨‍👩‍👧</span>
              <span>ولي الأمر</span>
            </button>

            {/* 4. لوحة تحكم الأدمن (SaaS Admin) */}
            <button
              onClick={() => {
                setRoleMode('ADMIN');
                setActiveTab('admin-stats');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                roleMode === 'ADMIN'
                  ? 'bg-slate-900 text-amber-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>👑</span>
              <span>الأدمن</span>
            </button>
          </div>

          {/* Teacher Sub-navigation */}
          {roleMode === 'TEACHER' && (
            <nav className="hidden lg:flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200/60">
              <button
                onClick={() => setActiveTab('exams')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeTab === 'exams' ? 'bg-white text-brand-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                الامتحانات والواجبات
              </button>
              <button
                onClick={() => setActiveTab('groups')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeTab === 'groups' ? 'bg-white text-brand-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                المجموعات والطلاب
              </button>
              <button
                onClick={() => setActiveTab('subscription')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeTab === 'subscription' ? 'bg-emerald-600 text-white shadow-xs' : 'text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>الاشتراك والفواتير (45 ج/طالب)</span>
              </button>
            </nav>
          )}

          {/* Action buttons & User profile */}
          <div className="flex items-center gap-3">
            {roleMode === 'TEACHER' && teacher && (
              <button
                onClick={onOpenNewExam}
                className="hidden sm:flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-md shadow-brand-500/20 transition hover:scale-105"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                امتحان جديد
              </button>
            )}

            {roleMode === 'TEACHER' && teacher && (
              <div className="flex items-center gap-2 pr-2 border-r border-slate-200">
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-bold text-slate-900">{teacher.name}</p>
                  <p className="text-[10px] text-slate-400">{teacher.centerName || 'مدرس المادة'}</p>
                </div>
                <button
                  onClick={onLogout}
                  title="تسجيل الخروج"
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
