'use client';

import React, { useMemo } from 'react';
import type { AttendanceRecord, Student, AttendanceStatus } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  TableFooter,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { subDays, eachDayOfInterval } from 'date-fns';

interface AttendanceTabProps {
  student: Student;
  recentRecords: AttendanceRecord[];
  semesterRecords: AttendanceRecord[];
}

const ATTENDANCE_STATUSES: Record<AttendanceStatus, { label: string; badgeVariant: "default" | "secondary" | "destructive" | "outline", badgeClass?: string }> = {
  Present: { label: '準時', badgeVariant: 'default', badgeClass: 'bg-green-600' },
  Late: { label: '遲到', badgeVariant: 'secondary', badgeClass: 'bg-yellow-500 text-black' },
  Sick: { label: '病假', badgeVariant: 'destructive', badgeClass: 'bg-orange-500' },
  Personal: { label: '事假', badgeVariant: 'destructive', badgeClass: 'bg-blue-500' },
  Official: { label: '公假', badgeVariant: 'destructive', badgeClass: 'bg-purple-500' },
  Menstrual: { label: '生理假', badgeVariant: 'destructive', badgeClass: 'bg-pink-500' },
  Bereavement: { label: '喪假', badgeVariant: 'destructive', badgeClass: 'bg-gray-500' },
  Absent: { label: '缺席', badgeVariant: 'destructive', badgeClass: 'bg-red-600 text-white' },
};

const SUMMARY_ORDER: AttendanceStatus[] = ['Sick', 'Personal', 'Official', 'Menstrual', 'Bereavement', 'Late', 'Absent'];

export default function AttendanceTab({ student, recentRecords, semesterRecords }: AttendanceTabProps) {
  
  const dailySummary = useMemo(() => {
    const summary: Record<string, { counts: Record<string, number> }> = {};
    recentRecords.forEach(record => {
      if(record.status !== 'Present'){
         if (!summary[record.date]) {
            summary[record.date] = { counts: {} };
          }
          if (!summary[record.date].counts[record.status]) {
            summary[record.date].counts[record.status] = 0;
          }
          summary[record.date].counts[record.status]++;
      }
    });
    // The data is already sorted by date from the backend query
    return Object.entries(summary);
  }, [recentRecords]);

  const { totalRecentAbsencePeriods, totalRecentPeriods } = useMemo(() => {
    const totalRecentAbsencePeriods = recentRecords.filter(r => r.status !== 'Present').length;
    
    const today = new Date();
    const twoWeeksAgo = subDays(today, 13); // Include today, so 14 days total
    const interval = eachDayOfInterval({ start: twoWeeksAgo, end: today });
    
    const totalRecentPeriods = interval.reduce((acc, date) => {
        const dayOfWeek = date.getDay(); // Sunday=0, Monday=1, ..., Friday=5
        if (dayOfWeek >= 1 && dayOfWeek <= 4) { // Monday to Thursday
            return acc + 5;
        }
        if (dayOfWeek === 5) { // Friday
            return acc + 4;
        }
        return acc;
    }, 0);

    return { totalRecentAbsencePeriods, totalRecentPeriods };
  }, [recentRecords]);


  return (
    <Card>
      <CardHeader>
        <CardTitle>出缺勤紀錄</CardTitle>
        <CardDescription>
          檢視學生所有出缺勤狀況。記錄的登錄與修改請至「點名系統」頁面操作。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        <AttendanceSummary records={semesterRecords} />

        <div>
          <h3 className="text-lg font-semibold">最近 2 週內詳細紀錄</h3>
           <p className="text-sm text-muted-foreground mb-2">(僅顯示近 2 週內資料)</p>
          <div className="rounded-md border mt-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">日期</TableHead>
                  <TableHead>缺曠詳情</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dailySummary.length > 0 ? dailySummary.map(([date, { counts }]) => (
                  <TableRow key={date}>
                    <TableCell className="font-medium">{date}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                         {Object.entries(counts).map(([status, count]) => (
                           <Badge 
                               key={status}
                               variant={ATTENDANCE_STATUSES[status as AttendanceStatus]?.badgeVariant || 'default'}
                               className={ATTENDANCE_STATUSES[status as AttendanceStatus]?.badgeClass}
                           >
                             {ATTENDANCE_STATUSES[status as AttendanceStatus]?.label || status}: {count} 節
                           </Badge>
                         ))}
                      </div>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                      <TableCell colSpan={2} className="h-24 text-center">查無近 2 週出缺勤紀錄。</TableCell>
                  </TableRow>
                )}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell className="font-bold text-right">2週缺曠總計</TableCell>
                  <TableCell className="font-bold text-lg">
                    {totalRecentAbsencePeriods} / {totalRecentPeriods} 節
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AttendanceSummary({ records }: { records: AttendanceRecord[] }) {
  const summary = useMemo(() => {
    const stats: Record<string, number> = {};
    
    records.forEach(record => {
        if (record.status !== 'Present') {
            if (!stats[record.status]) {
                stats[record.status] = 0;
            }
            stats[record.status] += 1;
        }
    });

    const totalPeriods = Object.values(stats).reduce((acc, curr) => acc + curr, 0);

    return { stats, totalPeriods };
  }, [records]);

  return (
    <div>
        <h3 className="mb-2 text-lg font-semibold">本學期缺曠統計</h3>
        <p className="text-sm text-muted-foreground mb-2">(此處統計所有紀錄，不僅限近 2 週)</p>
        <div className="rounded-md border overflow-x-auto">
            <Table>
                <TableBody>
                    <TableRow className="bg-muted/50">
                        <TableHead className="font-bold">缺曠假別</TableHead>
                        {SUMMARY_ORDER.map(status => (
                            <TableCell key={status} className="text-center font-bold px-2 py-2">
                                {ATTENDANCE_STATUSES[status].label}
                            </TableCell>
                        ))}
                         <TableCell className="text-center font-bold px-2 py-2">節數統計</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableHead className="font-bold">小計(節)</TableHead>
                        {SUMMARY_ORDER.map(status => (
                            <TableCell key={status} className="text-center px-2 py-2">
                                {summary.stats[status] || 0}
                            </TableCell>
                        ))}
                         <TableCell className="text-center font-bold text-lg align-middle px-2 py-2">
                           {summary.totalPeriods} 節
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </div>
    </div>
  )
}
