
'use client';

import AppLayout from '@/components/layout/app-layout';
import StudentDetailClient from '@/components/students/student-detail-client';
import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useData } from '@/context/data-context';
import { useAuth } from '@/context/auth-context';

// This page component now acts as a lightweight wrapper.
// It receives the params object and passes it down to the actual client component.
export default function StudentDetailPage() {
  const params = useParams();
  const { loading: dataLoading } = useData();
  const { loading: authLoading } = useAuth();

  // The `useParams` hook might initially return an empty object on the client-side
  // before the router is ready. We handle this loading state.
  if (!params || !params.id || dataLoading || authLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin h-8 w-8" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Pass the entire params object to the client component */}
      <StudentDetailClient params={params as { id: string }} />
    </AppLayout>
  );
}
