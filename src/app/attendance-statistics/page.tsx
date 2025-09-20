
'use client'

import AppLayout from '@/components/layout/app-layout';
import AttendanceStatisticsClient from '@/components/attendance/attendance-statistics-client';
import SchoolWideAttendanceStats from '@/components/attendance/school-wide-attendance-stats';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { useData } from '@/context/data-context';
import { useAuth } from '@/context/auth-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, BookUser, Wand2 } from 'lucide-react';
import AtRiskStudentsIdentifier from '@/components/attendance/at-risk-students-identifier';

export default function AttendanceStatisticsPage() {
  const { permission, loading: authLoading } = useAuth();
  const { students: allStudents, attendanceRecords: allAttendance, classes, loading: dataLoading } = useData();

  const isLoading = authLoading || dataLoading;
  
  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin h-8 w-8" /></div>
      </AppLayout>
    )
  }
  
  if (permission?.role === 'part-time') {
      return (
          <AppLayout>
              <div className="text-center p-8">
                  <h2 className="text-xl font-bold">權限不足</h2>
                  <p>您沒有權限檢視此頁面。</p>
              </div>
          </AppLayout>
      );
  }
  
  const canViewCounselingData = permission?.role === 'admin';
  const assignedClasses = (permission?.role === 'teacher' && permission.assignedClasses) ? permission.assignedClasses : classes;

  return (
    <AppLayout>
      <Tabs defaultValue="school-wide" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="school-wide">
                <BarChart className="mr-2 h-4 w-4" />
                全校出席率統計
            </TabsTrigger>
            <TabsTrigger value="class-details">
                 <BookUser className="mr-2 h-4 w-4" />
                班級缺曠明細
            </TabsTrigger>
             <TabsTrigger value="at-risk-students">
                 <Wand2 className="mr-2 h-4 w-4" />
                高風險學生洞察
            </TabsTrigger>
        </TabsList>
        <TabsContent value="school-wide">
            <Suspense fallback={<div className="flex justify-center items-center h-48"><Loader2 className="animate-spin h-8 w-8" /></div>}>
              <SchoolWideAttendanceStats allStudents={allStudents} allAttendance={allAttendance} />
            </Suspense>
        </TabsContent>
        <TabsContent value="class-details">
             <AttendanceStatisticsClient classes={assignedClasses || []} />
        </TabsContent>
        <TabsContent value="at-risk-students">
             <AtRiskStudentsIdentifier canViewCounselingData={canViewCounselingData} />
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
