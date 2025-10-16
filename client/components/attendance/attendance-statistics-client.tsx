
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Student, AttendanceRecord } from '@/types';
import { startOfWeek, subDays, startOfMonth, isWithinInterval, subMonths } from 'date-fns';
import { BookUser, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useData } from '@/context/data-context';

interface StudentStats {
  studentId: string;
  name: string;
  seatNumber: string;
  thisWeek: number;
  lastWeek: number;
  thisMonth: number;
  lastMonth: number;
  thisSemester: number;
}

interface AttendanceStatisticsClientProps {
  classes: string[];
}

export default function AttendanceStatisticsClient({ classes }: AttendanceStatisticsClientProps) {
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [stats, setStats] = useState<StudentStats[]>([]);
  const { toast } = useToast();
  const { students: allStudents, attendanceRecords: allAttendance, loading: dataLoading } = useData();
  
  useEffect(() => {
    if (classes.length > 0 && !selectedClass) {
        setSelectedClass(classes[0]);
    }
  }, [classes, selectedClass]);


  useEffect(() => {
    if (!selectedClass || dataLoading) return;

    const studentsInClass = allStudents.filter(s => (s.currentClass || s.className) === selectedClass);
    const studentIdsInClass = new Set(studentsInClass.map(s => s.studentId));
    const attendanceForClass = allAttendance.filter(r => studentIdsInClass.has(r.studentId));

    const now = new Date();
    // This week
    const startOfThisWeek = startOfWeek(now, { weekStartsOn: 1 });
    
    // Last week
    const startOfLastWeek = startOfWeek(subDays(now, 7), { weekStartsOn: 1 });
    const endOfLastWeek = subDays(startOfThisWeek, 1);

    // This month
    const startOfThisMonth = startOfMonth(now);

    // Last month
    const startOfLastMonth = startOfMonth(subMonths(now, 1));
    const endOfLastMonth = subDays(startOfThisMonth, 1);


    const calculatedStats: StudentStats[] = studentsInClass.map(student => {
      const studentRecords = attendanceForClass.filter(r => r.studentId === student.studentId && r.status !== 'Present');

      const thisWeekRecords = studentRecords.filter(r => isWithinInterval(new Date(r.date), { start: startOfThisWeek, end: now }));
      const lastWeekRecords = studentRecords.filter(r => isWithinInterval(new Date(r.date), { start: startOfLastWeek, end: endOfLastWeek }));
      const thisMonthRecords = studentRecords.filter(r => isWithinInterval(new Date(r.date), { start: startOfThisMonth, end: now }));
      const lastMonthRecords = studentRecords.filter(r => isWithinInterval(new Date(r.date), { start: startOfLastMonth, end: endOfLastMonth }));
      
      return {
        studentId: student.studentId,
        name: student.name,
        seatNumber: student.seatNumber || 'N/A',
        thisWeek: thisWeekRecords.length,
        lastWeek: lastWeekRecords.length,
        thisMonth: thisMonthRecords.length,
        lastMonth: lastMonthRecords.length,
        thisSemester: studentRecords.length,
      };
    });

    setStats(calculatedStats.sort((a,b) => (a.seatNumber || '99').localeCompare(b.seatNumber || '99', undefined, {numeric: true})));

  }, [selectedClass, allStudents, allAttendance, dataLoading]);

  if (classes.length === 0) {
    return null;
  }

  return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookUser />
            班級學生缺曠統計
          </CardTitle>
          <CardDescription>請選擇班級以查看該班級學生的詳細缺曠統計資料。</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 w-full sm:w-[200px]">
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger>
                <SelectValue placeholder="選擇班級" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">座號</TableHead>
                  <TableHead>學生姓名</TableHead>
                  <TableHead className="text-center">本週缺曠 (節)</TableHead>
                  <TableHead className="text-center">上週缺曠 (節)</TableHead>
                  <TableHead className="text-center">本月缺曠 (節)</TableHead>
                  <TableHead className="text-center">上月缺曠 (節)</TableHead>
                  <TableHead className="text-center">本學期累計 (節)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dataLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <div className="flex justify-center items-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        <span>正在計算統計資料...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : stats.length > 0 ? (
                  stats.map(stat => (
                    <TableRow key={stat.studentId}>
                      <TableCell>{stat.seatNumber}</TableCell>
                      <TableCell className="font-medium">{stat.name}</TableCell>
                      <TableCell className="text-center">{stat.thisWeek}</TableCell>
                      <TableCell className="text-center">{stat.lastWeek}</TableCell>
                      <TableCell className="text-center">{stat.thisMonth}</TableCell>
                      <TableCell className="text-center">{stat.lastMonth}</TableCell>
                      <TableCell className="text-center font-bold">{stat.thisSemester}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      {selectedClass ? '此班級尚無學生或缺曠資料可供統計。' : '請先選擇一個班級。'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
  );
}
