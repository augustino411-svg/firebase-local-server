
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell, TableFooter } from '@/components/ui/table';
import type { Student, CounselingRecord, UserRole } from '@/types';
import { HeartHandshake, Loader2, BookOpen, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { COUNSELING_TYPES } from './counseling-tab';
import { Button } from '../ui/button';
import { format as formatDate } from 'date-fns';
import * as XLSX from 'xlsx';
import { useAuth } from '@/context/auth-context';
import { useData } from '@/context/data-context';
import { getRoleLabel } from '@/lib/utils';


interface CounselingStatisticsClientProps {
  classes: string[];
}


interface ClassStats {
  className: string;
  grade: number;
  totalStudents: number;
  counseledStudentsCount: number;
  counseledRatio: number;
  personalTalksCount: number;
  familyContactCount: number;
}

const getGradeFromClassName = (className: string): number => {
  if (className.includes('一')) return 1;
  if (className.includes('二')) return 2;
  if (className.includes('三')) return 3;
  return 0; // Ungraded or other
};


export default function CounselingStatisticsClient({ classes }: CounselingStatisticsClientProps) {
  const { permission } = useAuth();
  const { students: allStudents, counselingRecords: allCounselingRecords, loading: dataLoading } = useData();

  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  const [selectedClass, setSelectedClass] = useState<string>('');
  
  const studentNameMap = useMemo(() => new Map(allStudents.map(s => [s.studentId, s.name])), [allStudents]);
  
  const visibleClasses = useMemo(() => {
    if (!permission) return [];
    if (permission.role === 'admin') return classes;
    if (permission.role === 'teacher') return permission.assignedClasses || [];
    return [];
  }, [permission, classes]);

  useEffect(() => {
    if (visibleClasses.length > 0 && !selectedClass) {
        setSelectedClass(visibleClasses[0]);
    }
  }, [visibleClasses, selectedClass]);
  
  const classRecords = useMemo(() => {
      if (!selectedClass) return [];
      const records = allCounselingRecords
        .filter(r => (allStudents.find(s => s.studentId === r.studentId)?.currentClass || allStudents.find(s => s.studentId === r.studentId)?.className) === selectedClass)
        .sort((a,b) => b.date.localeCompare(a.date));

      if(permission?.role === 'teacher') {
          return records.filter(r => r.visibleToTeacher === 'yes');
      }
      return records;
  }, [selectedClass, allCounselingRecords, allStudents, permission]);

  const stats = useMemo(() => {
    const studentsByClass: Record<string, Student[]> = {};
    allStudents.forEach(student => {
      const className = student.currentClass || student.className;
      if (!studentsByClass[className]) studentsByClass[className] = [];
      studentsByClass[className].push(student);
    });

    const recordsByClass: Record<string, CounselingRecord[]> = {};
    allCounselingRecords.forEach(record => {
        const student = allStudents.find(s => s.studentId === record.studentId);
        const effectiveClass = student?.currentClass || student?.className;
        if (effectiveClass) {
          if (!recordsByClass[effectiveClass]) recordsByClass[effectiveClass] = [];
          recordsByClass[effectiveClass].push(record);
        }
    });
    
    const relevantClasses = (permission?.role === 'admin' || permission?.role === 'teacher') ? Object.keys(studentsByClass) : [];

    const calculatedStats: ClassStats[] = relevantClasses.map(className => {
      const students = studentsByClass[className] || [];
      const records = recordsByClass[className] || [];
      const totalStudents = students.length;
      
      const counseledStudentIds = new Set(records.map(r => r.studentId));
      const counseledStudentsCount = counseledStudentIds.size;

      const personalTalksCount = records.filter(r => r.recordType === '個人談話記錄').length;
      const familyContactCount = records.filter(r => r.recordType === '家庭聯繫紀錄').length;

      return {
        className,
        grade: getGradeFromClassName(className),
        totalStudents,
        counseledStudentsCount,
        counseledRatio: totalStudents > 0 ? (counseledStudentsCount / totalStudents) * 100 : 0,
        personalTalksCount,
        familyContactCount,
      };
    });

    return calculatedStats.sort((a,b) => a.className.localeCompare(b.className));
  }, [allStudents, allCounselingRecords, permission]);


  const { gradeAvgs, schoolTotal } = useMemo(() => {
    const avgs: Record<number, {
        totalStudents: number;
        counseledStudentsCount: number;
        personalTalksCount: number;
        familyContactCount: number;
        classCount: number;
    }> = {};

    const total = {
        totalStudents: 0,
        counseledStudentsCount: 0,
        personalTalksCount: 0,
        familyContactCount: 0,
    }

    stats.forEach(stat => {
        total.totalStudents += stat.totalStudents;
        total.counseledStudentsCount += stat.counseledStudentsCount;
        total.personalTalksCount += stat.personalTalksCount;
        total.familyContactCount += stat.familyContactCount;
        
        if (stat.grade > 0) {
            if (!avgs[stat.grade]) {
                avgs[stat.grade] = { totalStudents: 0, counseledStudentsCount: 0, personalTalksCount: 0, familyContactCount: 0, classCount: 0 };
            }
            avgs[stat.grade].totalStudents += stat.totalStudents;
            avgs[stat.grade].counseledStudentsCount += stat.counseledStudentsCount;
            avgs[stat.grade].personalTalksCount += stat.personalTalksCount;
            avgs[stat.grade].familyContactCount += stat.familyContactCount;
            avgs[stat.grade].classCount++;
        }
    });

    return { gradeAvgs: avgs, schoolTotal: total };
  }, [stats]);

  const maskName = (name: string | null | undefined): string => {
    if (!name) return 'N/A';
    if (name.length >= 3) {
      return `${name.charAt(0)}XX`;
    }
    if (name.length === 2) {
      return `${name.charAt(0)}X`;
    }
    return name;
  };


  const handleDownload = async (recordType: '個人談話記錄' | '家庭聯繫紀錄', scope: 'class' | 'all') => {
      setIsDownloading(true);
      try {
          let recordsToDownload = allCounselingRecords.filter(r => r.recordType === recordType);
          
          if (scope === 'class') {
              if(!selectedClass) {
                  toast({ title: '錯誤', description: '請先選擇一個班級以下載班級資料。', variant: 'destructive'});
                  setIsDownloading(false);
                  return;
              }
              const classStudentIds = new Set(allStudents.filter(s => (s.currentClass || s.className) === selectedClass).map(s => s.studentId));
              recordsToDownload = recordsToDownload.filter(r => classStudentIds.has(r.studentId));
          } else { // scope === 'all'
              if(permission?.role === 'teacher') {
                  const teacherClassStudentIds = new Set(allStudents.filter(s => s.className && (permission.assignedClasses || []).includes(s.className)).map(s => s.studentId));
                  recordsToDownload = recordsToDownload.filter(r => teacherClassStudentIds.has(r.studentId));
              }
              // Admin can download all, so no extra filter needed.
          }
          
          let dataForSheet;
          if (recordType === '個人談話記錄') {
              dataForSheet = recordsToDownload.map(record => ({
                  '學年度': record.academicYear,
                  '學期': record.semester,
                  '學生姓名': maskName(studentNameMap.get(record.studentId)),
                  '學號': record.studentId,
                  '日期': formatDate(new Date(record.date), 'yyyy/MM/dd'),
                  '詢問方式': record.inquiryMethod || 'N/A',
                  '是否開放給班導查看': record.visibleToTeacher === 'yes' ? '是' : '否',
                  '輔導類型代碼': record.counselingType,
                  '記事': record.notes,
                  '填寫人': `${record.authorName || record.authorEmail} (${getRoleLabel(record.authorRole) || '未知'})`
              }));
          } else { // 家庭聯繫紀錄
              dataForSheet = recordsToDownload.map(record => ({
                  '學年度': record.academicYear,
                  '學期': record.semester,
                  '學生姓名': maskName(studentNameMap.get(record.studentId)),
                  '學號': record.studentId,
                  '日期': formatDate(new Date(record.date), 'yyyy/MM/dd'),
                  '訪問方式': record.inquiryMethod || 'N/A',
                  '聯繫者': maskName(record.contactPerson),
                  '是否開放給班導查看': record.visibleToTeacher === 'yes' ? '是' : '否',
                  '輔導類型代碼': record.counselingType,
                  '記事': record.notes,
                  '填寫人': `${record.authorName || record.authorEmail} (${getRoleLabel(record.authorRole) || '未知'})`
              }));
          }


          const worksheet = XLSX.utils.json_to_sheet(dataForSheet);
          const workbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(workbook, worksheet, recordType);

          const fileName = `${formatDate(new Date(), 'yyyyMMdd')}-${scope === 'class' ? selectedClass : '全校'}-${recordType === '個人談話記錄' ? '個別談話' : '家庭聯繫'}.xls`;
          XLSX.writeFile(workbook, fileName);
          
          toast({ title: '成功', description: `資料已開始下載。`});
      } catch (error) {
          console.error("Download failed:", error);
          toast({ title: '下載失敗', description: '產生檔案時發生錯誤。', variant: 'destructive'});
      } finally {
          setIsDownloading(false);
      }
  };


  const renderRow = (stat: ClassStats, isAvg = false) => (
    <TableRow key={stat.className} className={isAvg ? 'bg-muted/50 font-bold' : ''}>
      <TableCell className="font-medium">{stat.className}</TableCell>
      <TableCell className="text-center">{stat.totalStudents} 人</TableCell>
      <TableCell className="text-center">{stat.counseledStudentsCount} 人</TableCell>
      <TableCell className="text-center">{stat.counseledRatio.toFixed(1)}%</TableCell>
      <TableCell className="text-center">{stat.personalTalksCount} 次</TableCell>
      <TableCell className="text-center">{stat.familyContactCount} 次</TableCell>
    </TableRow>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HeartHandshake />
            學生輔導統計表
          </CardTitle>
          <CardDescription>統計各班級的學生輔導狀況，包含人數、比例與次數。</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">班級/年級</TableHead>
                  <TableHead className="text-center">班級人數</TableHead>
                  <TableHead className="text-center">輔導人數</TableHead>
                  <TableHead className="text-center">人數比例</TableHead>
                  <TableHead className="text-center">個別談話次數</TableHead>
                  <TableHead className="text-center">家庭聯繫次數</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dataLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <div className="flex justify-center items-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        <span>正在計算統計資料...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : stats.length > 0 ? (
                  <>
                    {[1, 2, 3].map(grade => (
                      <React.Fragment key={grade}>
                        {stats.filter(cs => cs.grade === grade).map(stat => renderRow(stat))}
                         {gradeAvgs[grade] && permission?.role === 'admin' && renderRow({
                            className: `${grade}年級平均`,
                            grade: grade,
                            totalStudents: gradeAvgs[grade].totalStudents,
                            counseledStudentsCount: gradeAvgs[grade].counseledStudentsCount,
                            counseledRatio: gradeAvgs[grade].totalStudents > 0 ? (gradeAvgs[grade].counseledStudentsCount / gradeAvgs[grade].totalStudents) * 100 : 0,
                            personalTalksCount: gradeAvgs[grade].personalTalksCount,
                            familyContactCount: gradeAvgs[grade].familyContactCount,
                        }, true)}
                      </React.Fragment>
                    ))}
                    {permission?.role === 'admin' && renderRow({
                        className: '全校加總/平均',
                        grade: 0,
                        totalStudents: schoolTotal.totalStudents,
                        counseledStudentsCount: schoolTotal.counseledStudentsCount,
                        counseledRatio: schoolTotal.totalStudents > 0 ? (schoolTotal.counseledStudentsCount / schoolTotal.totalStudents) * 100 : 0,
                        personalTalksCount: schoolTotal.personalTalksCount,
                        familyContactCount: schoolTotal.familyContactCount,
                    }, true)}
                  </>
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      尚無資料可供統計。
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {(permission?.role === 'admin' || permission?.role === 'teacher') && (
        <Card>
            <CardHeader>
                <CardTitle>資料下載</CardTitle>
                <CardDescription>下載不同類型與範圍的輔導紀錄。</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-muted/50 rounded-lg space-y-4">
                    <h4 className="font-semibold text-center">個別談話紀錄</h4>
                    <Button onClick={() => handleDownload('個人談話記錄', 'class')} disabled={isDownloading || !selectedClass} className="w-full">
                        {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                        下載選取班級
                    </Button>
                     <Button onClick={() => handleDownload('個人談話記錄', 'all')} disabled={isDownloading} variant="outline" className="w-full">
                        {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                        下載全校資料
                    </Button>
                </div>
                 <div className="p-4 bg-muted/50 rounded-lg space-y-4">
                    <h4 className="font-semibold text-center">家庭聯繫紀錄</h4>
                    <Button onClick={() => handleDownload('家庭聯繫紀錄', 'class')} disabled={isDownloading || !selectedClass} className="w-full">
                        {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                        下載選取班級
                    </Button>
                     <Button onClick={() => handleDownload('家庭聯繫紀錄', 'all')} disabled={isDownloading} variant="outline" className="w-full">
                        {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                        下載全校資料
                    </Button>
                </div>
            </CardContent>
        </Card>
      )}

       <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen />
            班級輔導紀錄查詢
          </CardTitle>
          <CardDescription>請選擇班級以查看該班級所有學生的詳細輔導紀錄。</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 w-full sm:w-[200px]">
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger>
                <SelectValue placeholder="選擇班級" />
              </SelectTrigger>
              <SelectContent>
                {visibleClasses.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">班級</TableHead>
                  <TableHead className="w-[120px]">姓名</TableHead>
                  <TableHead className="w-[120px]">學號</TableHead>
                  <TableHead className="w-[120px]">日期</TableHead>
                  <TableHead className="w-[150px]">詢問方式</TableHead>
                  <TableHead className="w-[250px]">輔導類型</TableHead>
                  <TableHead>記事</TableHead>
                  <TableHead className="w-[150px]">填寫人</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dataLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      <div className="flex justify-center items-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        <span>正在載入紀錄...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : classRecords.length > 0 ? (
                  classRecords.map(record => (
                    <TableRow key={record.id}>
                      <TableCell>{record.className}</TableCell>
                      <TableCell>{studentNameMap.get(record.studentId) || 'N/A'}</TableCell>
                      <TableCell>{record.studentId}</TableCell>
                      <TableCell>{record.date}</TableCell>
                      <TableCell>{record.inquiryMethod || 'N/A'}</TableCell>
                      <TableCell>{COUNSELING_TYPES[record.counselingType as keyof typeof COUNSELING_TYPES] || record.counselingType}</TableCell>
                      <TableCell className="whitespace-pre-wrap">{record.notes}</TableCell>
                      <TableCell>{`${record.authorName || record.authorEmail} (${getRoleLabel(record.authorRole) || '未知'})`}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      {selectedClass ? '此班級尚無輔導紀錄。' : '請先選擇一個班級。'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
