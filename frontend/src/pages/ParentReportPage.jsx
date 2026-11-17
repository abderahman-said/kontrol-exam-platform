import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ParentReportView from '../components/ParentReportView';

export default function ParentReportPage() {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 font-cairo p-4 sm:p-8">
      <ParentReportView
        attemptId={attemptId}
        onBack={() => navigate('/')}
      />
    </div>
  );
}
