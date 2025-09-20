
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Student, AttendanceStatus, AttendanceRecord } from '@/types';
import { addRollCallRecords } from '@/lib/data-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { CalendarIcon, User, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/auth-context';
import { useData } from '@/context/data-context';
import AttendanceImportDialog from './attendance-import-dialog';

const PERIODS = [
  { id: 'period1', label: '第一節', time: '18:00-18:45' },
  { id: 'period2', label: '第二節', time: '19:00-19:35' },
  { id: 'period3', label: '第三節', time: '19:45-20:25' },
  { id: 'period4', label: '第四節', time: '20:35-21:15' },
  { id: 'period5', label: '第五節', time: '21:15-22:00' },
];

const ATTENDANCE_STATUSES: Record<AttendanceStatus, { label: string; icon: string }> = {
  Present: { label: '準時', icon: '✅' },
  Late: { label: '遲到', icon: '🏃' },
  Sick: { label: '病假', icon: '🌡️' },
  Personal: { label: '事假', icon: '👤' },
  Official: { label: '公假', icon: '📄' },
  Menstrual: { label: '生理假', icon: '🩸' },
  Bereavement: { label: '喪假', icon: '🖤' },
  Absent: { label: '缺席', icon: '❌' },
};


type AttendanceState = Record<string, Record<string, AttendanceStatus>>;

export default function RollCallClient() {
  const { students: allStudents, classes, attendanceRecords, loading: dataLoading } = useData();
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [date, setDate] = useState<Date>(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attendance, setAttendance] = useState<AttendanceState>({});
  const { toast } = useToast();
  const { permission } = useAuth();
  
  useEffect(() => {
    // When classes from global context are loaded, set the first one as default
    if (classes.length > 0 && !selectedClass) {
        setSelectedClass(classes[0]);
    }
  }, [classes, selectedClass]);

  const activePeriods = useMemo(() => {
    const day = date.getDay(); // Sunday = 0, Friday = 5
    if (day === 5) { // Friday
      return PERIODS.slice(0, 4);
    }
    return PERIODS;
  }, [date]);


  const students = useMemo(() => {
    if (!selectedClass) return [];
    return allStudents
      .filter(s => (s.currentClass || s.className) === selectedClass)
      .sort((a, b) => (a.seatNumber || '99').localeCompare(b.seatNumber || '99', 'zh-TW', { numeric: true }))
  }, [allStudents, selectedClass]);


  const initializeAttendance = useCallback(() => {
    const newAttendance: AttendanceState = {};
    if (!selectedClass || !date) return;

    const formattedDate = format(date, 'yyyy-MM-dd');
    const recordsForDay = attendanceRecords.filter(r => r.className === selectedClass && r.date === formattedDate);
    
    const recordsMap: Record<string, Record<string, AttendanceStatus>> = {};
    const periodLabelToId = Object.fromEntries(PERIODS.map(p => [p.label, p.id]));

    recordsForDay.forEach(record => {
      const periodId = periodLabelToId[record.period];
      if (!recordsMap[record.studentId]) {
        recordsMap[record.studentId] = {};
      }
      if(periodId) {
        recordsMap[record.studentId][periodId] = record.status;
      }
    });

    students.forEach(student => {
      newAttendance[student.studentId] = {};
      activePeriods.forEach(period => {
        const status = recordsMap[student.studentId]?.[period.id];
        if (status && status !== 'Present') {
          newAttendance[student.studentId][period.id] = status;
        }
      });
    });
    setAttendance(newAttendance);
  }, [selectedClass, date, students, attendanceRecords, activePeriods]);


  useEffect(() => {
      initializeAttendance();
  }, [initializeAttendance]);
  
  const handleStatusChange = (studentId: string, periodId: string, status: AttendanceStatus) => {
    setAttendance(prev => {
        const newState = JSON.parse(JSON.stringify(prev)); // Deep copy
        
        if (!newState[studentId]) {
            newState[studentId] = {};
        }

        if (status === 'Present') {
            delete newState[studentId][periodId];
            if (Object.keys(newState[studentId]).length === 0) {
                delete newState[studentId];
            }
        } else {
            newState[studentId][periodId] = status;
        }
        
        return newState;
    });
  };

 const handleBulkStudentChange = (studentId: string, status: AttendanceStatus) => {
    setAttendance(prev => {
      const newState = JSON.parse(JSON.stringify(prev)); // Deep copy

      if (status === 'Present') {
        // If setting to Present, just remove the student's record for the day
        delete newState[studentId];
      } else {
        // Otherwise, set all active periods to the new status
        if (!newState[studentId]) {
          newState[studentId] = {};
        }
        activePeriods.forEach(period => {
          newState[studentId][period.id] = status;
        });
      }
      return newState;
    });
  };


  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
        await addRollCallRecords({ attendance,  students,  selectedClass,  date: format(date, 'yyyy-MM-dd'),
        });

        toast({
          title: '點名完成',
          description: `已成功儲存 ${selectedClass} 於 ${format(date, 'yyyy-MM-dd')} 的點名紀錄。`,
        });
    } catch (error: any) {
        toast({
            title: '儲存失敗',
            description: `寫入資料庫時發生錯誤: ${error.message}。請檢查開發人員主控台是否有建立索引的連結。`,
            variant: 'destructive',
        });
        console.error("Roll call submission error:", error);
        if (error.message && error.message.includes('firestore/failed-precondition')) {
            console.error("FIRESTORE INDEXING REQUIRED: Please create the composite index in the Firebase console. A link should be available in the error log.")
        }
    } finally {
        setIsSubmitting(false);
    }
  };


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>每日點名</CardTitle>
          <CardDescription>請選擇班級與日期以進行點名。系統會自動載入該日已存在的紀錄。</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
                <Select value={selectedClass} onValueChange={setSelectedClass} disabled={classes.length === 0}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="選擇班級" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={'outline'}
                      className={cn(
                        'w-full sm:w-[240px] justify-start text-left font-normal',
                        !date && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, 'PPP') : <span>選擇日期</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(d) => d && setDate(d)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                 <AttendanceImportDialog />
              </div>
               <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mt-4 sm:mt-0 ml-auto">
                <Badge variant="outline" className="py-2 px-3">
                  <User className="mr-2 h-4 w-4" />
                  {permission?.name || permission?.email}
                </Badge>
                <Button onClick={handleSubmit} disabled={isSubmitting || dataLoading} className="w-full sm:w-auto">
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isSubmitting ? '儲存中...' : '儲存點名紀錄'}
                </Button>
              </div>
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table className="whitespace-nowrap">
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-card z-10 w-[120px]">學號</TableHead>
                    <TableHead className="sticky left-[120px] bg-card z-10 w-[200px]">姓名 / 全日設定</TableHead>
                    {activePeriods.map(period => (
                      <TableHead key={period.id} className="text-center w-[150px]">
                        <div className="flex flex-col items-center">
                            <span>{period.label}</span>
                            <span className="text-xs font-normal text-muted-foreground">{period.time}</span>
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dataLoading ? (
                    <TableRow>
                      <TableCell colSpan={2 + activePeriods.length} className="h-24 text-center">
                        <div className="flex justify-center items-center">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                           <span> 讀取中...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : students.length > 0 ? (
                    students.map(student => (
                      <TableRow key={student.studentId}>
                        <TableCell className="sticky left-0 bg-card z-10">{student.studentId}</TableCell>
                        <TableCell className="sticky left-[120px] bg-card z-10 font-medium">
                            <div className="flex items-center gap-2">
                                <span>{student.name}</span>
                                <BulkStudentActionSelect 
                                    studentId={student.studentId} 
                                    onChange={handleBulkStudentChange} 
                                />
                            </div>
                        </TableCell>
                        {activePeriods.map(period => (
                          <TableCell key={period.id} className="text-center">
                            <StatusSelect 
                                value={attendance[student.studentId]?.[period.id] || 'Present'}
                                onValueChange={(status) => handleStatusChange(student.studentId, period.id, status as AttendanceStatus)}
                            />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={2 + activePeriods.length} className="h-24 text-center">
                        {classes.length > 0 ? '此班級尚無學生資料。' : '系統尚無任何班級資料。'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
        </CardContent>
      </Card>
       <div className="flex justify-end mt-6">
        <Button onClick={handleSubmit} disabled={isSubmitting || dataLoading} className="w-full sm:w-auto">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? '儲存中...' : '儲存點名紀錄'}
        </Button>
      </div>
    </div>
  );
}

function BulkStudentActionSelect({studentId, onChange}: {studentId: string, onChange: (studentId: string, status: AttendanceStatus) => void}) {
    return (
        <Select onValueChange={(status) => onChange(studentId, status as AttendanceStatus)}>
            <SelectTrigger className="h-8 mt-1 text-xs w-[100px]">
                <SelectValue placeholder="全日修改" />
            </SelectTrigger>
            <SelectContent>
                 {Object.entries(ATTENDANCE_STATUSES).map(([key, value]) => (
                    <SelectItem key={key} value={key}>{value.label}</SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}


function StatusSelect({value, onValueChange}: {value: AttendanceStatus, onValueChange: (status: string) => void}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-[100px] text-xs h-9 mx-auto">
            <SelectValue/>
        </SelectTrigger>
        <SelectContent>
            {Object.entries(ATTENDANCE_STATUSES).map(([key, statusInfo]) => (
                <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                        <span>{statusInfo.icon}</span>
                        <span>{statusInfo.label}</span>
                    </div>
                </SelectItem>
            ))}
        </SelectContent>
    </Select>
  );
}
