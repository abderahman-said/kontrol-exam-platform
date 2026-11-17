import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import StudentExamPortal from '../components/StudentExamPortal';

export default function StudentExamPage() {
  const { code } = useParams();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 font-cairo">
      <StudentExamPortal
        initialCode={code || ''}
        onExit={() => navigate('/student/dashboard')}
      />
    </div>
  );
}
