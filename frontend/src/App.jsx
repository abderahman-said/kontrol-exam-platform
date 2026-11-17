import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import TeacherLoginPage from './pages/TeacherLoginPage';
import TeacherDashboardPage from './pages/TeacherDashboardPage';
import NewExamPage from './pages/NewExamPage';
import StudentLoginPage from './pages/StudentLoginPage';
import StudentDashboardPage from './pages/StudentDashboardPage';
import StudentExamPage from './pages/StudentExamPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import ParentReportPage from './pages/ParentReportPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 1. البوابة العامة (للمعلمين والطلاب فقط) */}
        <Route path="/" element={<LandingPage />} />

        {/* 2. بوابة المعلم والسنتر المستقلة */}
        <Route path="/teacher/login" element={<TeacherLoginPage />} />
        <Route path="/teacher/dashboard" element={<TeacherDashboardPage />} />
        <Route path="/teacher/exams/new" element={<NewExamPage />} />

        {/* 3. بوابة وحساب الطالب المستقلة */}
        <Route path="/student/login" element={<StudentLoginPage />} />
        <Route path="/student/dashboard" element={<StudentDashboardPage />} />
        <Route path="/student/exam/:code" element={<StudentExamPage />} />

        {/* 4. بوابة صاحب المشروع الخاصة والسرية (Owner / Master Control) */}
        <Route path="/owner-portal" element={<AdminLoginPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />

        {/* 5. بوابة ولي الأمر وشهادات التقدير المباشرة */}
        <Route path="/parent/report/:attemptId" element={<ParentReportPage />} />

        {/* توجيه أي مسار غير معروف للرئيسية */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
