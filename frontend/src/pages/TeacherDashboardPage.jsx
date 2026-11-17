import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, Users, CreditCard, LogOut, PlusCircle, 
  ChevronLeft, ArrowRight, Share2, Sparkles, Layers, Building2
} from 'lucide-react';
import Logo from '../components/Logo';
import ExamsDashboard from '../components/ExamsDashboard';
import ExamDetailsView from '../components/ExamDetailsView';
import GroupsManager from '../components/GroupsManager';
import TeacherSubscriptionView from '../components/TeacherSubscriptionView';
import AIEssayGraderModal from '../components/AIEssayGraderModal';
import { examsAPI, groupsAPI } from '../services/api';

export default function TeacherDashboardPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('exams'); // 'exams' | 'groups' | 'subscription'
  const [teacher, setTeacher] = useState(null);
  const [exams, setExams] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState(null);
  const [isAiGraderOpen, setIsAiGraderOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('teacher_token');
    const userStr = localStorage.getItem('teacher_user');

    if (!token) {
      navigate('/teacher/login');
      return;
    }

    if (userStr) {
      try { setTeacher(JSON.parse(userStr)); } catch (e) {}
    }

    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [examsRes, groupsRes] = await Promise.all([
        examsAPI.getAll(),
        groupsAPI.getAll()
      ]);
      setExams(examsRes.data.exams || []);
      setGroups(groupsRes.data.groups || []);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('teacher_token');
        navigate('/teacher/login');
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('teacher_token');
    localStorage.removeItem('teacher_user');
    navigate('/teacher/login');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-cairo text-right selection:bg-[#02936C] selection:text-white">
      
      {/* ========================================================
          الهيدر العلوي المطور للمدرب والسنتر (Teacher Header)
      ======================================================== */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          
          {/* الجانب الأيمن: الشعار + اسم السنتر */}
          <div className="flex items-center gap-3 shrink-0">
            <div 
              className="cursor-pointer transition hover:opacity-90" 
              onClick={() => { setActiveTab('exams'); setSelectedExamId(null); }}
              title="لوحة تحكم كَنترول"
            >
              <Logo size="sm" />
            </div>

            {teacher?.centerName && (
              <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200/90 px-3 py-1.5 rounded-xl font-bold">
                <Building2 className="w-3.5 h-3.5 text-[#02936C]" />
                <span>{teacher.centerName}</span>
              </div>
            )}
          </div>

          {/* المنتصف: التبويبات المتوازنة (Segmented Navigation) */}
          <nav className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-2xl border border-slate-200/70 shadow-2xs">
            <button
              onClick={() => {
                setActiveTab('exams');
                setSelectedExamId(null);
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                activeTab === 'exams'
                  ? 'bg-white text-[#03243F] shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/40'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-[#02936C]" />
              <span>الامتحانات</span>
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                activeTab === 'exams' ? 'bg-[#03243F] text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                {exams.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('groups')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                activeTab === 'groups'
                  ? 'bg-white text-[#03243F] shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/40'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>المجموعات</span>
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                activeTab === 'groups' ? 'bg-[#03243F] text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                {groups.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('subscription')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                activeTab === 'subscription'
                  ? 'bg-white text-[#02936C] shadow-xs border border-emerald-200/70'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/40'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5 text-[#02936C]" />
              <span>الاشتراك ورصيد الأكواد</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </button>
          </nav>

          {/* الجانب الأيسر: الإجراءات السريعة + بروفايل المعلم + خروج */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsAiGraderOpen(true)}
              className="hidden md:flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-[#03243F] border border-slate-200/90 px-3 py-1.5 rounded-xl text-xs font-black transition shadow-2xs"
              title="تصحيح المقالي بالذكاء الاصطناعي وقراءة خط اليد"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#02936C]" />
              <span>تصحيح مقالي AI</span>
            </button>

            <button
              onClick={() => navigate('/teacher/exams/new')}
              className="bg-[#02936C] hover:bg-[#027d5c] text-white px-3.5 py-1.5 rounded-xl text-xs font-black shadow-md shadow-[#02936C]/20 transition hover:scale-[1.02] active:scale-[0.98] flex items-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>امتحان جديد</span>
            </button>

            {/* بروفايل المعلم وزر الخروج */}
            <div className="flex items-center gap-1.5 pr-1.5 border-r border-slate-200">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-2 py-1 rounded-xl">
                <div className="w-6 h-6 rounded-lg bg-[#03243F] text-white flex items-center justify-center font-black text-[11px] shadow-2xs">
                  {teacher?.name ? teacher.name.trim().charAt(0) : 'م'}
                </div>
                <span className="text-xs font-black text-[#03243F] hidden xl:inline max-w-[100px] truncate">
                  {teacher?.name || 'أستاذ المادة'}
                </span>
              </div>

              <button
                onClick={handleLogout}
                title="تسجيل الخروج"
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-transparent hover:border-rose-100 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>
      </header>

      {/* ========================================================
          منطقة المحتوى الرئيسي للداشبورد (Main Workspace)
      ======================================================== */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {activeTab === 'exams' && (
          selectedExamId ? (
            <ExamDetailsView
              examId={selectedExamId}
              onBack={() => {
                setSelectedExamId(null);
                loadData();
              }}
            />
          ) : (
            <ExamsDashboard
              exams={exams}
              groupsCount={groups.length}
              onSelectExam={(id) => setSelectedExamId(id)}
              onOpenNewExam={() => navigate('/teacher/exams/new')}
            />
          )
        )}

        {activeTab === 'groups' && (
          <GroupsManager />
        )}

        {activeTab === 'subscription' && (
          <TeacherSubscriptionView
            onBack={() => setActiveTab('exams')}
          />
        )}

      </main>

      {/* نافذة مصحح الأسئلة المقالية بالذكاء الاصطناعي وقراءة خط اليد */}
      <AIEssayGraderModal
        isOpen={isAiGraderOpen}
        onClose={() => setIsAiGraderOpen(false)}
      />

    </div>
  );
}
