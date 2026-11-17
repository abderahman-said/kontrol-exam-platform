import axios from 'axios';

// عنوان الباك إند: يُقرأ من VITE_API_BASE_URL في Vercel أو يستخدم الرابط المنشور تلقائياً
export const BACKEND_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/api\/?$/, '') || 
  (import.meta.env.PROD ? 'https://exam-backend-ten.vercel.app' : 'http://localhost:5000');

export const API_BASE = import.meta.env.VITE_API_BASE_URL || `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
  // تحديد التوكن المناسب حسب نوع الصفحة المفتوحة
  const path = window.location.pathname;
  let token = null;

  if (path.startsWith('/admin')) {
    token = localStorage.getItem('admin_token');
  } else if (path.startsWith('/student')) {
    token = localStorage.getItem('student_token');
  } else {
    token = localStorage.getItem('teacher_token');
  }

  // Fallback لأي توكن مسجل
  if (!token) {
    token = localStorage.getItem('admin_token') || localStorage.getItem('teacher_token') || localStorage.getItem('student_token');
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  teacherLogin: (data) => api.post('/auth/teacher/login', data),
  teacherRegister: (data) => api.post('/auth/teacher/register', data),
  studentLogin: (data) => api.post('/auth/student/login', data),
  adminLogin: (data) => api.post('/auth/admin/login', data),
  getMe: () => api.get('/auth/me'),
};

export const groupsAPI = {
  getAll: () => api.get('/groups'),
  create: (data) => api.post('/groups', data),
  getById: (id) => api.get(`/groups/${id}`),
  addStudent: (groupId, data) => api.post(`/groups/${groupId}/students`, data),
  addStudentsBatch: (groupId, students) => api.post(`/groups/${groupId}/students/batch`, { students }),
  delete: (id) => api.delete(`/groups/${id}`),
};

export const examsAPI = {
  getAll: () => api.get('/exams'),
  getById: (id) => api.get(`/exams/${id}`),
  create: (formData) => api.post('/exams', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  exportExcelUrl: (id) => `${API_BASE}/exams/${id}/export-excel?token=${localStorage.getItem('teacher_token') || localStorage.getItem('auth_token') || ''}`,
  omrScanSubmit: (id, data) => api.post(`/exams/${id}/omr-scan`, data),
  aiGradeEssay: (data) => api.post('/exams/ai-grade-essay', data),
  // Student Portal
  studentJoin: (data) => api.post('/exams/student/join', data),
  logCheatEvent: (attemptId, reason) => api.post(`/exams/attempts/${attemptId}/cheat-event`, { reason }),
  submitAttempt: (attemptId, answers) => api.post(`/exams/attempts/${attemptId}/submit`, { answers }),
  getParentReport: (attemptId) => api.get(`/exams/reports/parent/${attemptId}`),
};

export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getTeachers: () => api.get('/admin/teachers'),
  getPayments: () => api.get('/admin/payments'),
  updatePaymentStatus: (id, status) => api.patch(`/admin/payments/${id}/status`, { status }),
};

export const subscriptionAPI = {
  get: () => api.get('/subscription'),
  pay: (data) => api.post('/subscription/pay', data),
  updatePricing: (data) => api.put('/subscription/pricing', data),
};

export const studentAPI = {
  login: (data) => api.post('/auth/student/login', data),
  getDashboard: () => api.get('/student/dashboard'),
  aiExplain: (data) => api.post('/student/ai-explain', data),
  aiChat: (data) => api.post('/student/ai-chat', data),
  getAIStatus: () => api.get('/student/ai-status'),
  saveAIConfig: (data) => api.post('/student/ai-config', data),
};

export default api;
