
'use client';

import AppLayout from '@/components/layout/app-layout';
import StudentDashboard from '@/components/students/student-dashboard';

export default function StudentsPage() {
  return (
    <AppLayout>
      <StudentDashboard />
    </AppLayout>
  );
}
