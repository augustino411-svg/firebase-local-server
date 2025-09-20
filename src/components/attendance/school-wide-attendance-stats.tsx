
'use client';

import React, { useMemo, useState, useEffect } from 'react';
import type { Student, AttendanceRecord } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { BarChart, Users, Loader2 } from 'lucide-react';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths, eachDayOfInterval, isWithinInterval, format } from 'date-fns';
import { getSettings } from '@/lib/data-client';
import { Badge } from '../ui/badge';


interface SchoolWideAttendanceStatsProps {
  allStudents: Student[];
  allAttendance: AttendanceRecord[];
}

interface ClassStats {
  className: string;
  grade: number;
  totalStudents: number;
  today: number | 'holiday';
  thisWeek: number;
  lastWeek: number;
  thisMonth: number;
  lastMonth: number;
}

const getGradeFromClassName = (className: string): number => {
  if (className.includes('一')) return 1;
  if (className.includes('二')) return 2;
  if (className.includes('三')) return 3;
  return 0; // Ungraded or other
};

export default function SchoolWideAttendanceStats({ allStudents, allAttendance }: SchoolWideAttendanceStatsProps) {
  const [holidays, setHolidays] = useState<Set<string>>(new Set());
  const [loadingSettings, setLoadingSettings] = useState(true);

  useEffect(() => {
    async function fetchSemesterSettings() {
      const now = new Date();
      const academicYear = now.getMonth() >= 7 ? now.getFullYear() - 1911 : now.getFullYear() - 1912;
      try {
        const settings = await getSettings(String(academicYear));
        if (settings && Array.isArray(settings.holidays)) {
          setHolidays(new Set(settings.holidays));
        }
      } catch (error) {
        console.error("Failed to fetch holiday settings:", error);
      } finally {
        setLoadingSettings(false);
      }
    }
    fetchSemesterSettings();
  }, []);

  const getPeriodsForDay = (date: Date): number => {
    const dateString = format(date, 'yyyy-MM-dd');
    if (holidays.has(dateString)) {
      return 0;
    }
    const dayOfWeek = date.getDay(); // Sunday=0, ..., Friday=5
    if (dayOfWeek === 5) return 4; // Friday
    if (dayOfWeek >= 1 && dayOfWeek <= 4) return 5; // Monday-Thursday
    return 0; // Weekend
  };

  const calculateAttendanceRate = (
    records: AttendanceRecord[],
    totalStudentsInClass: number,
    startDate: Date,
    endDate: Date
  ): number => {
    if (totalStudentsInClass === 0) return 100; // No students, 100% attendance

    const intervalDays = eachDayOfInterval({ start: startDate, end: endDate });
    
    let totalExpectedPeriods = 0;
    for (const day of intervalDays) {
      totalExpectedPeriods += getPeriodsForDay(day);
    }
    totalExpectedPeriods *= totalStudentsInClass;
    
    if (totalExpectedPeriods === 0) return 100; // No school days, 100% attendance

    const relevantRecords = records.filter(r => {
      const recordDate = new Date(r.date);
      return isWithinInterval(recordDate, { start: startDate, end: endDate });
    });

    const nonPresentPeriods = relevantRecords.filter(r => r.status !== 'Present').length;
    const attendedPeriods = totalExpectedPeriods - nonPresentPeriods;
    const attendanceRate = (attendedPeriods / totalExpectedPeriods) * 100;
    
    return attendanceRate < 0 ? 0 : attendanceRate; // Cap at 0%
  };


  const { classStats, gradeAvgs, schoolAvg, isTodayHoliday } = useMemo(() => {
    if (loadingSettings) return { classStats: [], gradeAvgs: {}, schoolAvg: null, isTodayHoliday: false };
    
    const studentsByClass: Record<string, Student[]> = {};
    allStudents.forEach(student => {
      const className = student.currentClass || student.className;
      if (!studentsByClass[className]) studentsByClass[className] = [];
      studentsByClass[className].push(student);
    });

    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const todayEnd = new Date(now.setHours(23, 59, 59, 999));
    const todayString = format(todayStart, 'yyyy-MM-dd');
    const isTodayHoliday = holidays.has(todayString) || todayStart.getDay() === 0 || todayStart.getDay() === 6;

    const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
    const thisWeekEnd = endOfWeek(now, { weekStartsOn: 1 });

    const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
    const lastWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
    
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);

    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    const calculatedStats: ClassStats[] = Object.keys(studentsByClass).map(className => {
      const studentsInClass = studentsByClass[className];
      const studentIdsInClass = new Set(studentsInClass.map(s => s.studentId));
      
      const recordsForThisClassRoster = allAttendance.filter(r => studentIdsInClass.has(r.studentId));
      
      const totalStudents = studentsInClass.length;

      return {
        className,
        grade: getGradeFromClassName(className),
        totalStudents: totalStudents,
        today: isTodayHoliday ? 'holiday' : calculateAttendanceRate(recordsForThisClassRoster, totalStudents, todayStart, todayEnd),
        thisWeek: calculateAttendanceRate(recordsForThisClassRoster, totalStudents, thisWeekStart, thisWeekEnd),
        lastWeek: calculateAttendanceRate(recordsForThisClassRoster, totalStudents, lastWeekStart, lastWeekEnd),
        thisMonth: calculateAttendanceRate(recordsForThisClassRoster, totalStudents, thisMonthStart, thisMonthEnd),
        lastMonth: calculateAttendanceRate(recordsForThisClassRoster, totalStudents, lastMonthStart, lastMonthEnd),
      };
    });
    
    // Calculate Averages
    const gradeAvgs: Record<number, Omit<ClassStats, 'today'> & {count: number, today: number | 'holiday'}> = {};
    const schoolTotal: Omit<ClassStats, 'today'> & {count: number, today: number | 'holiday'} = { className: '全校平均', grade: 0, totalStudents: 0, today: 0, thisWeek: 0, lastWeek: 0, thisMonth: 0, lastMonth: 0, count: 0 };
    schoolTotal.today = isTodayHoliday ? 'holiday' : 0;

    calculatedStats.forEach(stat => {
        if (stat.grade > 0) {
            if (!gradeAvgs[stat.grade]) {
                gradeAvgs[stat.grade] = { className: `${stat.grade}年級平均`, grade: stat.grade, totalStudents: 0, today: isTodayHoliday ? 'holiday' : 0, thisWeek: 0, lastWeek: 0, thisMonth: 0, lastMonth: 0, count: 0 };
            }
            gradeAvgs[stat.grade].totalStudents += stat.totalStudents;
            if (typeof stat.today === 'number' && typeof gradeAvgs[stat.grade].today === 'number') {
              (gradeAvgs[stat.grade].today as number) += stat.today;
            }
            gradeAvgs[stat.grade].thisWeek += stat.thisWeek;
            gradeAvgs[stat.grade].lastWeek += stat.lastWeek;
            gradeAvgs[stat.grade].thisMonth += stat.thisMonth;
            gradeAvgs[stat.grade].lastMonth += stat.lastMonth;
            gradeAvgs[stat.grade].count++;
        }
    });

    Object.values(gradeAvgs).forEach(gradeAvg => {
        if (typeof gradeAvg.today === 'number' && gradeAvg.count > 0) {
           gradeAvg.today /= gradeAvg.count;
        }
        gradeAvg.thisWeek /= gradeAvg.count;
        gradeAvg.lastWeek /= gradeAvg.count;
        gradeAvg.thisMonth /= gradeAvg.count;
        gradeAvg.lastMonth /= gradeAvg.count;

        schoolTotal.totalStudents += gradeAvg.totalStudents;
        if(typeof gradeAvg.today === 'number' && typeof schoolTotal.today === 'number'){
          (schoolTotal.today as number) += gradeAvg.today * gradeAvg.count;
        }
        schoolTotal.thisWeek += gradeAvg.thisWeek * gradeAvg.count;
        schoolTotal.lastWeek += gradeAvg.lastWeek * gradeAvg.count;
        schoolTotal.thisMonth += gradeAvg.thisMonth * gradeAvg.count;
        schoolTotal.lastMonth += gradeAvg.lastMonth * gradeAvg.count;
        schoolTotal.count += gradeAvg.count;
    });

    if (schoolTotal.count > 0) {
        if (typeof schoolTotal.today === 'number') {
            schoolTotal.today /= schoolTotal.count;
        }
        schoolTotal.thisWeek /= schoolTotal.count;
        schoolTotal.lastWeek /= schoolTotal.count;
        schoolTotal.thisMonth /= schoolTotal.count;
        schoolTotal.lastMonth /= schoolTotal.count;
    }

    return { classStats: calculatedStats.sort((a,b) => a.className.localeCompare(b.className)), gradeAvgs, schoolAvg: schoolTotal, isTodayHoliday };
  }, [allStudents, allAttendance, holidays, loadingSettings]);

  const renderRow = (stat: Partial<ClassStats> & { className: string, today: number | 'holiday' }, isAvg = false) => (
    <TableRow key={stat.className} className={isAvg ? 'bg-muted/50 font-bold' : ''}>
      <TableCell className="font-medium">{stat.className}</TableCell>
      <TableCell className="text-center">{stat.totalStudents} 人</TableCell>
      <TableCell className="text-center">
        {stat.today === 'holiday' ? 
            <Badge variant="outline">假日</Badge> : 
            `${stat.today?.toFixed(1)}%`
        }
      </TableCell>
      <TableCell className="text-center">{stat.thisWeek?.toFixed(1)}%</TableCell>
      <TableCell className="text-center">{stat.lastWeek?.toFixed(1)}%</TableCell>
      <TableCell className="text-center">{stat.thisMonth?.toFixed(1)}%</TableCell>
      <TableCell className="text-center">{stat.lastMonth?.toFixed(1)}%</TableCell>
    </TableRow>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <BarChart />
            全校班級出席統計
        </CardTitle>
        <CardDescription>比較全校各班級的出席率。出席率 = (實際出席總節數 / 應到總節數) * 100%。</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px]">班級/年級</TableHead>
                <TableHead className="w-[100px] text-center">班級人數</TableHead>
                <TableHead className="text-center">本日出席率</TableHead>
                <TableHead className="text-center">本週出席率</TableHead>
                <TableHead className="text-center">上週出席率</TableHead>
                <TableHead className="text-center">本月出席率</TableHead>
                <TableHead className="text-center">上月出席率</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingSettings ? (
                 <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    <div className="flex justify-center items-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        <span>正在讀取假日設定並計算統計...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : classStats.length > 0 ? (
                <>
                  {[1, 2, 3].map(grade => (
                    <React.Fragment key={grade}>
                      {classStats.filter(cs => cs.grade === grade).map(stat => renderRow(stat))}
                      {(gradeAvgs as Record<number, ClassStats>)[grade] && renderRow((gradeAvgs as Record<number, ClassStats>)[grade], true)}
                    </React.Fragment>
                  ))}
                  {schoolAvg && renderRow(schoolAvg, true)}
                </>
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    尚無資料可供統計。
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
