import React, { useState, useEffect } from 'react';
import { 
  Users, Plus, UserPlus, Trash2, Phone, GraduationCap, 
  CheckCircle, Search, MessageSquare, Sparkles, Building2, BookOpen
} from 'lucide-react';
import { groupsAPI } from '../services/api';

export default function GroupsManager() {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [studentSearch, setStudentSearch] = useState('');

  // Modal إضافة مجموعة
  const [isAddGroupOpen, setIsAddGroupOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupSubject, setNewGroupSubject] = useState('الفيزياء');

  // Modal إضافة طالب
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [addMode, setAddMode] = useState('single'); // 'single' | 'batch'
  const [batchText, setBatchText] = useState('');
  const [batchLoading, setBatchLoading] = useState(false);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const res = await groupsAPI.getAll();
      setGroups(res.data.groups || []);
      if (res.data.groups && res.data.groups.length > 0 && !selectedGroup) {
        loadGroupDetails(res.data.groups[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadGroupDetails = async (id) => {
    try {
      const res = await groupsAPI.getById(id);
      setSelectedGroup(res.data.group);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    try {
      await groupsAPI.create({ name: newGroupName.trim(), subject: newGroupSubject.trim() });
      setNewGroupName('');
      setIsAddGroupOpen(false);
      loadGroups();
    } catch (err) {
      alert('فشل إنشاء المجموعة');
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!studentName.trim() || !parentPhone.trim() || !selectedGroup) return;
    try {
      await groupsAPI.addStudent(selectedGroup.id, {
        name: studentName.trim(),
        parentPhone: parentPhone.trim(),
        studentPhone: studentPhone.trim()
      });
      setStudentName('');
      setParentPhone('');
      setStudentPhone('');
      setIsAddStudentOpen(false);
      loadGroupDetails(selectedGroup.id);
      loadGroups();
    } catch (err) {
      alert(err.response?.data?.error || 'فشل إضافة الطالب');
    }
  };

  const handleBatchAdd = async (e) => {
    e.preventDefault();
    if (!batchText.trim() || !selectedGroup) return;

    // تحليل السطور: الاسم, رقم ولي الأمر, رقم الطالب (اختياري)
    const lines = batchText.split('\n');
    const students = [];

    for (let line of lines) {
      const parts = line.split(/[,،\t]+/).map(p => p.trim()).filter(Boolean);
      if (parts.length >= 2) {
        students.push({
          name: parts[0],
          parentPhone: parts[1],
          studentPhone: parts[2] || ''
        });
      }
    }

    if (students.length === 0) {
      alert('لم يتم العثور على بيانات صالحة. يرجى كتابة: اسم الطالب، رقم ولي الأمر في كل سطر');
      return;
    }

    try {
      setBatchLoading(true);
      await groupsAPI.addStudentsBatch(selectedGroup.id, students);
      setBatchText('');
      setIsAddStudentOpen(false);
      loadGroupDetails(selectedGroup.id);
      loadGroups();
    } catch (err) {
      alert(err.response?.data?.error || 'فشل استيراد دفعة الطلاب');
    } finally {
      setBatchLoading(false);
    }
  };

  // إجمالي الطلاب في كل المجموعات
  const totalStudentsCount = groups.reduce((acc, g) => acc + (g._count?.students || 0), 0);

  // تصفية طلاب المجموعة المحددة بالبحث
  const filteredStudents = selectedGroup?.students?.filter((st) => 
    st.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
    st.parentPhone.includes(studentSearch) ||
    (st.studentPhone && st.studentPhone.includes(studentSearch))
  ) || [];

  return (
    <div className="space-y-6 text-right font-cairo selection:bg-[#02936C] selection:text-white">
      
      {/* ========================================================
          1. الهيدر الإداري للمجموعات والسناتر (Groups Header)
      ======================================================== */}
      <div className="bg-white p-6 sm:p-7 rounded-[2rem] border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-[#02936C] px-3 py-1 rounded-full text-xs font-black border border-emerald-200">
            <Building2 className="w-3.5 h-3.5" />
            <span>سجلات السناتر والفصول المدرسية</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#03243F]">
            إدارة المجموعات والطلاب وقوائم أولياء الأمور
          </h1>
          <p className="text-xs text-slate-500 max-w-xl">
            قسّم طلابك لفصول أو سناتر مع أرقام هواتف أولياء الأمور لإرسال تقارير الامتحانات ودرجات البابل شيت عبر واتساب تلقائياً فور التصحيح.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden lg:flex items-center gap-2 bg-slate-50 border border-slate-200 px-4 py-2 rounded-2xl text-xs font-bold text-slate-600">
            <Users className="w-4 h-4 text-[#02936C]" />
            <span>{totalStudentsCount} طالب مسجل</span>
          </div>

          <button
            onClick={() => setIsAddGroupOpen(true)}
            className="flex items-center gap-2 bg-[#02936C] hover:bg-[#027d5c] text-white px-5 py-3 rounded-2xl text-xs font-black shadow-md shadow-[#02936C]/20 transition hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>مجموعة جديدة</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          2. العرض الرئيسي: قائمة المجموعات يمين + كشف الطلاب يسار
      ======================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* قائمة المجموعات (Sidebar) */}
        <div className="md:col-span-4 bg-white rounded-3xl border border-slate-200/90 p-4 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-xs font-black text-[#03243F]">مجموعاتك وسناترك</span>
            <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
              {groups.length}
            </span>
          </div>

          {groups.length === 0 ? (
            <div className="text-center py-8 text-slate-400 space-y-2">
              <Users className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs font-bold">لا توجد مجموعات بعد</p>
              <button
                onClick={() => setIsAddGroupOpen(true)}
                className="text-xs text-[#02936C] font-black hover:underline"
              >
                + إنشاء أول مجموعة
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {groups.map((g) => {
                const isSelected = selectedGroup?.id === g.id;
                return (
                  <div
                    key={g.id}
                    onClick={() => loadGroupDetails(g.id)}
                    className={`p-4 rounded-2xl cursor-pointer border transition text-right ${
                      isSelected
                        ? 'border-[#02936C] bg-emerald-50/40 text-[#03243F] shadow-xs'
                        : 'border-slate-100 hover:border-slate-200 text-slate-700 bg-white hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-black ${
                        isSelected 
                          ? 'bg-[#02936C] text-white' 
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {g._count?.students || 0} طالب
                      </span>
                      <p className="text-sm font-black">{g.name}</p>
                    </div>
                    <div className="flex items-center justify-end gap-1.5 text-xs text-slate-400 mt-1 font-bold">
                      <BookOpen className="w-3 h-3 text-[#02936C]" />
                      <span>{g.subject || 'عام'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* كشف طلاب المجموعة المحددة (Students Table) */}
        <div className="md:col-span-8 bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
          {selectedGroup ? (
            <div>
              
              {/* ترويسة المجموعة والبحث والإضافة */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-4 border-b border-slate-100 mb-4">
                <div>
                  <h2 className="text-base font-black text-[#03243F] flex items-center gap-2">
                    <span>{selectedGroup.name}</span>
                    <span className="text-xs font-bold text-[#02936C] bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                      {selectedGroup.subject || 'المادة'}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 font-bold mt-0.5">
                    {selectedGroup.students?.length || 0} طالب مسجل في هذه المجموعة
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {/* بحث في طلاب المجموعة */}
                  <div className="relative flex-1 sm:w-48">
                    <input
                      type="text"
                      placeholder="بحث عن طالب..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold placeholder:text-slate-400 focus:outline-none focus:border-[#02936C]"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  </div>

                  <button
                    onClick={() => setIsAddStudentOpen(true)}
                    className="flex items-center gap-1.5 bg-[#03243F] hover:bg-[#063154] text-white px-3.5 py-2 rounded-xl text-xs font-black transition shrink-0 shadow-xs"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-[#02936C]" />
                    <span>إضافة طالب</span>
                  </button>
                </div>
              </div>

              {/* الجدول أو الرسالة الفارغة */}
              {selectedGroup.students?.length === 0 ? (
                <div className="text-center py-14 text-slate-400 space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <Users className="w-7 h-7 text-[#02936C]" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-[#03243F]">لا يوجد طلاب في هذه المجموعة بعد</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      اضغط على زر "إضافة طالب" لإدخال طالب مفرد أو نسخ قائمة كاملة من ملف إكسل دفعة واحدة.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsAddStudentOpen(true)}
                    className="bg-[#02936C] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs hover:bg-[#027d5c] transition"
                  >
                    + إضافة أول طالب
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-100">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-black border-b border-slate-200">
                      <tr>
                        <th className="p-3">#</th>
                        <th className="p-3">اسم الطالب</th>
                        <th className="p-3">رقم ولي الأمر (واتساب)</th>
                        <th className="p-3">رقم الطالب</th>
                        <th className="p-3 text-center">مراسلة فورية</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredStudents.map((st, i) => (
                        <tr key={st.id} className="hover:bg-slate-50/70 transition">
                          <td className="p-3 font-bold text-slate-400">{i + 1}</td>
                          <td className="p-3 font-bold text-[#03243F] flex items-center gap-2">
                            <span className="w-7 h-7 rounded-full bg-slate-100 text-[#03243F] font-black text-[10px] flex items-center justify-center shrink-0 border border-slate-200">
                              {st.name.charAt(0)}
                            </span>
                            <span>{st.name}</span>
                          </td>
                          <td className="p-3 text-[#02936C] font-mono font-bold tracking-wider">
                            {st.parentPhone}
                          </td>
                          <td className="p-3 text-slate-400 font-mono">
                            {st.studentPhone || '—'}
                          </td>
                          <td className="p-3 text-center">
                            <a
                              href={`https://wa.me/2${st.parentPhone.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#02936C] hover:bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200 transition"
                            >
                              <MessageSquare className="w-3 h-3" />
                              <span>واتساب</span>
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

            </div>
          ) : (
            <div className="text-center py-16 text-slate-400 space-y-2">
              <Building2 className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-sm font-bold text-[#03243F]">اختر مجموعة من القائمة الجانبية</p>
              <p className="text-xs text-slate-400">ستظهر هنا تفاصيل الطلاب وأرقام أولياء الأمور.</p>
            </div>
          )}
        </div>

      </div>

      {/* ========================================================
          3. Modal إنشاء مجموعة جديدة
      ======================================================== */}
      {isAddGroupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-black text-[#03243F]">إنشاء مجموعة أو سنتر جديد</h3>
            
            <form onSubmit={handleCreateGroup} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم المجموعة *</label>
                <input
                  type="text"
                  placeholder="مثال: سنتر الأوائل - فيزياء 3 ث"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-bold focus:border-[#02936C] focus:ring-2 focus:ring-[#02936C]/20 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">المادة الدراسية</label>
                <input
                  type="text"
                  placeholder="مثال: الفيزياء"
                  value={newGroupSubject}
                  onChange={(e) => setNewGroupSubject(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-bold focus:border-[#02936C] focus:ring-2 focus:ring-[#02936C]/20 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddGroupOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl flex-1 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-[#02936C] hover:bg-[#027d5c] text-white px-4 py-2.5 rounded-xl text-xs font-black flex-1 shadow-md shadow-[#02936C]/20 transition"
                >
                  إنشاء المجموعة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          4. Modal إضافة طالب (مفرد أو دفعة)
      ======================================================== */}
      {isAddStudentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-[#03243F]">
                إضافة إلى {selectedGroup?.name}
              </h3>
              
              {/* تبديل الوضع */}
              <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setAddMode('single')}
                  className={`px-3 py-1 rounded-lg transition ${
                    addMode === 'single' ? 'bg-white shadow-xs text-[#02936C] font-black' : 'text-slate-500'
                  }`}
                >
                  طالب واحد
                </button>
                <button
                  type="button"
                  onClick={() => setAddMode('batch')}
                  className={`px-3 py-1 rounded-lg transition ${
                    addMode === 'batch' ? 'bg-white shadow-xs text-[#02936C] font-black' : 'text-slate-500'
                  }`}
                >
                  لصق سريع (دفعة)
                </button>
              </div>
            </div>

            {addMode === 'single' ? (
              <form onSubmit={handleAddStudent} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">اسم الطالب *</label>
                  <input
                    type="text"
                    placeholder="مثال: حسام أحمد حسن"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-bold focus:border-[#02936C] focus:ring-2 focus:ring-[#02936C]/20 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم ولي الأمر (واتساب) *</label>
                  <input
                    type="tel"
                    placeholder="010XXXXXXXX"
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-bold focus:border-[#02936C] focus:ring-2 focus:ring-[#02936C]/20 focus:outline-none text-left font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم الطالب الشخصي (اختياري)</label>
                  <input
                    type="tel"
                    placeholder="01XXXXXXXXX"
                    value={studentPhone}
                    onChange={(e) => setStudentPhone(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-bold focus:border-[#02936C] focus:ring-2 focus:ring-[#02936C]/20 focus:outline-none text-left font-mono"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddStudentOpen(false)}
                    className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl flex-1 transition"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="bg-[#02936C] hover:bg-[#027d5c] text-white px-4 py-2.5 rounded-xl text-xs font-black flex-1 shadow-md shadow-[#02936C]/20 transition"
                  >
                    حفظ الطالب
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleBatchAdd} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    انسخ وألصق قائمة الطلاب (سطر لكل طالب من إكسل)
                  </label>
                  <p className="text-[11px] text-slate-400 mb-2">
                    الصيغة: <span className="font-mono bg-slate-100 px-1 py-0.5 rounded text-[#03243F]">اسم الطالب، رقم ولي الأمر، رقم الطالب</span>
                  </p>
                  <textarea
                    rows={6}
                    value={batchText}
                    onChange={(e) => setBatchText(e.target.value)}
                    placeholder={`حسام أحمد، 01011112222، 01022223333
محمد محمود، 01133334444
علي إبراهيم، 01244445555`}
                    className="w-full border border-slate-200 rounded-xl p-3 text-xs font-mono focus:border-[#02936C] focus:ring-2 focus:ring-[#02936C]/20 focus:outline-none leading-relaxed text-right"
                    required
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddStudentOpen(false)}
                    className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl flex-1 transition"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={batchLoading}
                    className="bg-[#02936C] hover:bg-[#027d5c] text-white px-4 py-2.5 rounded-xl text-xs font-black flex-1 shadow-md shadow-[#02936C]/20 transition disabled:opacity-50"
                  >
                    {batchLoading ? 'جاري الاستيراد...' : 'استيراد الدفعة فوراً'}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
