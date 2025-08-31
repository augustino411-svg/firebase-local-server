
'use client';

import AppLayout from '@/components/layout/app-layout';
import CounselingStatisticsClient from '@/components/counseling/counseling-statistics-client';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useData } from '@/context/data-context';

export default function CounselingStatisticsPage() {
  const { permission, loading: authLoading } = useAuth();
  const { classes, loading: dataLoading } = useData();

  const isLoading = authLoading || dataLoading;

  if (isLoading) {
    return (
        <AppLayout>
            <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin h-8 w-8" /></div>
        </AppLayout>
    )
  }
  
  // This check is correct, allowing admins and teachers.
  const canViewPage = permission?.role === 'admin' || permission?.role === 'teacher';
  if (!canViewPage) {
    return (
       <AppLayout>
          <div className="text-center p-8">
            <h2 className="text-xl font-bold">權限不足</h2>
            <p>您沒有權限檢視此頁面。</p>
          </div>
       </AppLayout>
    )
  }

  return (
    <AppLayout>
      <CounselingStatisticsClient classes={classes} />
    </AppLayout>
  );
}
