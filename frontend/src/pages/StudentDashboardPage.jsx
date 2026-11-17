import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, LogOut, ArrowRight, Bot, MessageSquare, Sparkles } from 'lucide-react';
import Logo from '../components/Logo';
import StudentDashboard from '../components/StudentDashboard';
import StudentAIChatModal from '../components/StudentAIChatModal';

export default function StudentDashboardPage() {
  const navigate = useNavigate();
  const [studentUser, setStudentUser] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatContextQuestion, setChatContextQuestion] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('student_token');
    if (!token) {
      navigate('/student/login');
      return;
    }
    const savedUser = localStorage.getItem('student_user');
    if (savedUser) {
      try {
        setStudentUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Failed to parse student_user', e);
      }
    }
  }, []);

  const handleStartExam = (code, studentName) => {
    navigate(`/student/exam/${code}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('student_token');
    localStorage.removeItem('student_user');
    navigate('/student/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-cairo text-right relative">
      
      {/* Student Portal Dedicated Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <span className="text-xs text-[#02936C] bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl font-bold hidden sm:inline-block">
              بوابة الطالب المستقلة 🎓
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick AI Tutor Button in Header */}
            <button
              onClick={() => {
                setChatContextQuestion(null);
                setIsChatOpen(true);
              }}
              className="flex items-center gap-2 text-xs font-black text-white bg-gradient-to-r from-[#03243F] to-[#02936C] hover:opacity-95 px-3.5 py-2.5 rounded-xl shadow-xs transition hover:scale-[1.02] active:scale-95"
              title="مستر كَنترول - المعلم الذكي"
            >
              <Bot className="w-4 h-4 text-emerald-300" />
              <span className="hidden sm:inline">دردش مع مستر كَنترول</span>
              <span className="sm:hidden">المعلم الذكي</span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
              </span>
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-red-600 bg-slate-100 hover:bg-red-50 px-3.5 py-2.5 rounded-xl transition"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        <StudentDashboard
          onStartExam={handleStartExam}
          onLogout={handleLogout}
          onOpenChatWithQuestion={(questionContext) => {
            setChatContextQuestion(questionContext);
            setIsChatOpen(true);
          }}
        />
      </main>

      {/* Persistent Floating AI Chat Button (Bottom Left) */}
      <div className="fixed bottom-6 left-6 z-40">
        <button
          onClick={() => {
            setChatContextQuestion(null);
            setIsChatOpen(true);
          }}
          className="group relative flex items-center gap-3 bg-gradient-to-r from-[#03243F] to-[#02936C] hover:from-[#053760] hover:to-[#027d5c] text-white px-4 sm:px-5 py-3.5 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 border border-emerald-400/30"
          title="افتح شات المساعد الذكي لمذاكرة المنهج"
        >
          {/* Pulsing beacon indicator */}
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400"></span>
          </span>

          <div className="text-right">
            <div className="text-xs font-black flex items-center gap-1.5">
              <span>مستر كَنترول الذكي</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            </div>
            <p className="text-[10px] text-emerald-200 font-bold hidden sm:block">اسأل في أي سؤال أو مفهوم مش فاهمه 💬</p>
          </div>

          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-white group-hover:scale-110 transition" />
          </div>
        </button>
      </div>

      {/* Student AI Chat Modal / Drawer */}
      <StudentAIChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        studentName={studentUser?.name || 'يا بطل'}
        contextQuestion={chatContextQuestion}
        onClearContext={() => setChatContextQuestion(null)}
      />

    </div>
  );
}