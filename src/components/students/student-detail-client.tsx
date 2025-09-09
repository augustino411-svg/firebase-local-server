
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Student, AttendanceRecord, CounselingRecord, UserWithRole } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, ClipboardCheck, HeartHandshake, ShieldAlert, Phone, Users, ArrowLeft, Loader2, FileClock, Lock } from 'lucide-react';
import Image from 'next/image';
import AttendanceTab from './attendance-tab';
import CounselingTab from '../counseling/counseling-tab';
import { useAuth } from '@/context/auth-context';
import { useData } from '@/context/data-context';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { notFound } from 'next/navigation';
import { getStatusText, getStatusVariant } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { useToast } from '@/hooks/use-toast';

interface StudentDetailClientProps {
  params: { id: string };
}

export default function StudentDetailClient({ params }: StudentDetailClientProps) {
  const { id: studentId } = params;
  const { students, attendanceRecords, counselingRecords, refetchData } = useData();
  const { permission } = useAuth();
  const router = useRouter();
  
  const student = useMemo(() => students.find(s => s.studentId === studentId), [students, studentId]);

  const { semesterAttendance, recentAttendance } = useMemo(() => {
    if (!student) return { semesterAttendance: [], recentAttendance: [] };
    const studentAllAttendance = attendanceRecords.filter(r => r.studentId === studentId);
    
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const studentRecentRecords = studentAllAttendance.filter(r => 
      new Date(r.date) >= twoWeeksAgo
    );

    return { semesterAttendance: studentAllAttendance, recentAttendance: studentRecentRecords };
  }, [attendanceRecords, studentId, student]);


  const canViewCounseling = useMemo(() => {
    if (!permission || !student) return false;
    // Admin can always see counseling records.
    if (permission.role === 'admin') {
      return true;
    }
    // Part-time teachers can never see counseling records.
    if (permission.role === 'part-time') {
      return false;
    }
    // Teacher can see if the student is in one of their assigned classes.
    if (permission.role === 'teacher') {
      const effectiveStudentClass = student.currentClass || student.className;
      return !!effectiveStudentClass && !!permission.assignedClasses && permission.assignedClasses.includes(effectiveStudentClass);
    }
    return false;
  }, [permission, student]);

  const initialCounselingRecords = useMemo(() => {
    if (!student || !canViewCounseling) return [];
    
    const studentRecords = counselingRecords.filter(record => record.studentId === studentId);

    // For teachers, filter further to only show records marked as visible
    if(permission?.role === 'teacher') {
        return studentRecords.filter(record => record.visibleToTeacher === 'yes');
    }

    // Admin sees all records for the student
    return studentRecords.sort((a, b) => b.date.localeCompare(a.date));
  }, [counselingRecords, studentId, student, canViewCounseling, permission]);
  
  const handleRecordChange = () => {
    refetchData();
  }

  if (!student) {
      // DataContext has loaded, but student not found.
      // This can happen if a teacher tries to access a student from a class they don't have permission for.
      return (
         <div className="text-center p-8">
            <h2 className="text-xl font-bold">權限不足或查無此學生</h2>
            <p>您無法檢視此學生的資料，或該學生不存在。</p>
            <Button onClick={() => router.back()} className="mt-4">返回</Button>
          </div>
      )
  }
  
  const getGenderText = (genderCode?: string) => {
    if (genderCode === '1') return '男';
    if (genderCode === '2') return '女';
    return '未提供';
  }

  return (
    <div className="space-y-6">
       <div>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回學生列表
        </Button>
      </div>
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Image
            src={student.profilePictureUrl || 'https://placehold.co/100x100.png'}
            alt={student.name}
            width={100}
            height={100}
            className="rounded-lg shadow-md"
            data-ai-hint="person portrait"
          />
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <CardTitle className="text-3xl font-bold text-primary">{student.name}</CardTitle>
              <Badge variant={getStatusVariant(student.statusCode)} className="text-base px-3 py-1">
                {getStatusText(student.statusCode)}
              </Badge>
            </div>
            <CardDescription className="text-lg text-muted-foreground">
              {student.studentId}
            </CardDescription>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                <p><strong>班級:</strong> {student.currentClass || student.className}</p>
                <p><strong>座號:</strong> {student.seatNumber || 'N/A'}</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="personal_info" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="personal_info">
            <User className="mr-2 h-4 w-4" />
            個人資料
          </TabsTrigger>
          <TabsTrigger value="attendance">
            <ClipboardCheck className="mr-2 h-4 w-4" />
            出缺勤
          </TabsTrigger>
          <TabsTrigger value="counseling">
            <HeartHandshake className="mr-2 h-4 w-4" />
            輔導紀錄
          </TabsTrigger>
           <TabsTrigger value="status_change_log">
            <FileClock className="mr-2 h-4 w-4" />
            歷史異動紀錄
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal_info">
          <Card>
            <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center">基本資料</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <InfoItem label="姓名" value={student.name} />
                        <InfoItem label="學號" value={student.studentId} />
                        <InfoItem label="性別" value={getGenderText(student.gender)} />
                        <InfoItem label="生日" value={student.birthDate} />
                        <InfoItem label="身分證號" value={student.nationalId} />
                        <InfoItem label="血型" value={student.bloodType} />
                        <InfoItem label="特殊身份" value={student.specialCode} />
                        <InfoItem label="原住民族別" value={student.ethnicity} />
                        <InfoItem label="山地/平地" value={student.mountainOrPlain} />
                        <InfoItem label="畢業國中" value={student.graduatedSchool} />
                        <InfoItem label="入學管道" value={student.admissionType} />
                        <InfoItem label="新生教育程度" value={student.educationLevel} />
                    </div>
                </div>
                <Separator />
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center"><Phone className="mr-2 h-5 w-5 text-primary" />聯絡方式</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <InfoItem label="電子郵件" value={student.email} />
                        <InfoItem label="手機" value={student.mobile} />
                        <InfoItem label="戶籍電話" value={student.residencePhone} />
                        <InfoItem label="通訊電話" value={student.contactPhone} />
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <InfoItem label="戶籍地址" value={student.residenceAddress} zip={student.residenceZip} />
                        <InfoItem label="通訊地址" value={student.contactAddress} zip={student.contactZip}/>
                    </div>
                </div>
                <Separator />
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center"><Users className="mr-2 h-5 w-5 text-primary" />家庭背景</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <InfoItem label="監護人姓名" value={student.guardianName} />
                        <InfoItem label="監護人關係" value={student.guardianRelation} />
                        <InfoItem label="監護人職業" value={student.guardianOccupation} />
                         <InfoItem label="監護人手機" value={student.guardianMobile} />
                        <InfoItem label="父親手機" value={student.fatherMobile} />
                        <InfoItem label="母親手機" value={student.motherMobile} />
                    </div>
                </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance">
          <AttendanceTab student={student} recentRecords={recentAttendance} semesterRecords={semesterAttendance} />
        </TabsContent>

        <TabsContent value="counseling">
          {canViewCounseling ? (
            <CounselingTab student={student} initialNotes={initialCounselingRecords} onRecordChange={handleRecordChange} />
          ) : (
             <Card>
                <CardContent className="p-6 text-center text-muted-foreground flex flex-col items-center justify-center min-h-[400px]">
                  <Lock className="h-10 w-10 mb-4 text-destructive"/>
                  <h3 className="text-lg font-semibold text-foreground">權限不足</h3>
                  <p>您沒有權限檢視此學生的輔導紀錄。</p>
                  <p className="text-xs mt-1">您的權限等級不足，或此學生的班級不在您的負責範圍內。</p>
                </CardContent>
             </Card>
          )}
        </TabsContent>

        <TabsContent value="status_change_log">
            <Card>
                <CardHeader>
                    <CardTitle>歷史異動紀錄</CardTitle>
                    <CardDescription>此學生所有的學籍狀態變更歷史。如需操作，請至「批次學籍管理」頁面。</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border max-h-96 overflow-y-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>日期</TableHead>
                                    <TableHead>異動類型</TableHead>
                                    <TableHead>備註</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {student.changeLog && student.changeLog.length > 0 ? (
                                    student.changeLog.slice().sort((a, b) => b.date.localeCompare(a.date)).map((log, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{log.date}</TableCell>
                                            <TableCell>{log.type}</TableCell>
                                            <TableCell>{log.note}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="h-24 text-center">
                                            尚無任何異動紀錄。
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

const InfoItem = ({label, value, zip}: {label: string, value?: string | null, zip?: string | null}) => (
    <div>
        <p className="font-semibold text-muted-foreground">{label}</p>
        <p className="text-foreground">{zip && `${zip} `}{value || 'N/A'}</p>
    </div>
)
