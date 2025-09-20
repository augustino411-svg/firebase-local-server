
'use client';

import React, { useState, useEffect, useMemo, useTransition } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Wand2, AlertTriangle, SlidersHorizontal, BookUser, FileClock, ShieldAlert, Lock } from 'lucide-react';
import { getSettings } from '@/lib/data-client';
import { getInterventionSuggestions } from '@/lib/actions';
import type { Student, AttendanceRecord, CounselingRecord } from '@/types';
import { Button } from '../ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Badge } from '../ui/badge';
import InterventionSuggestions from '../students/intervention-suggestions';
import { useData } from '@/context/data-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { differenceInDays, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

type FilterType = 'semester_ratio' | 'fixed_periods' | 'recent_periods';

interface AtRiskStudentsIdentifierProps {
  canViewCounselingData: boolean;
}

export default function AtRiskStudentsIdentifier({ canViewCounselingData }: AtRiskStudentsIdentifierProps) {
    const { students: allStudents, attendanceRecords: allAttendance, counselingRecords: allCounseling, loading: dataLoading } = useData();

    const [filterType, setFilterType] = useState<FilterType>('recent_periods');
    const [threshold, setThreshold] = useState<number>(10);
    const [semesterTotalPeriods, setSemesterTotalPeriods] = useState<number>(0);
    const [atRiskStudents, setAtRiskStudents] = useState<Student[]>([]);
    
    // Calculate total periods for the semester
    useEffect(() => {
        async function fetchSemesterSettings() {
            const now = new Date();
            // Assuming academic year is based on the start of the school year in August
            const academicYear = now.getMonth() >= 7 ? now.getFullYear() - 1911 : now.getFullYear() - 1912;
            const settings = await getSettings(String(academicYear));
            
            if (settings && settings.startDate && settings.endDate && settings.holidays) {
                const startDate = parseISO(settings.startDate);
                const endDate = parseISO(settings.endDate);
                
                const totalDays = differenceInDays(endDate, startDate) + 1;
                const holidaySet = new Set(settings.holidays);
                let workDays = 0;
                for (let i = 0; i < totalDays; i++) {
                    const currentDate = new Date(startDate);
                    currentDate.setDate(startDate.getDate() + i);
                    const dayOfWeek = currentDate.getDay();
                    const dateString = currentDate.toISOString().split('T')[0];

                    if (dayOfWeek >= 1 && dayOfWeek <= 5 && !holidaySet.has(dateString)) {
                        workDays++;
                    }
                }
                // Assuming 5 periods Mon-Thu, 4 periods Fri. Average ~4.8/day
                setSemesterTotalPeriods(Math.round(workDays * 4.8));
            } else {
                 setSemesterTotalPeriods(450); // Fallback if settings are not complete
            }
        }
        fetchSemesterSettings();
    }, []);

    // Filter students based on selected criteria
    useEffect(() => {
        if (dataLoading) return;

        const findAtRiskStudents = () => {
            const attendanceByUser: Record<string, number> = {};

            allAttendance.forEach(record => {
                 if (record.status !== 'Present') {
                    if (!attendanceByUser[record.studentId]) {
                        attendanceByUser[record.studentId] = 0;
                    }
                    attendanceByUser[record.studentId]++;
                 }
            });

            let risky: Student[] = [];
            if (filterType === 'fixed_periods') {
                 risky = allStudents.filter(student => (attendanceByUser[student.studentId] || 0) >= threshold);
            } else if (filterType === 'semester_ratio' && semesterTotalPeriods > 0) {
                 const ratio = 1 / threshold; // threshold is 3, 4, or 5
                 risky = allStudents.filter(student => (attendanceByUser[student.studentId] || 0) >= (semesterTotalPeriods * ratio));
            } else if (filterType === 'recent_periods') {
                const recentAttendanceByUser: Record<string, number> = {};
                const twoWeeksAgo = new Date();
                twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

                allAttendance.forEach(record => {
                    if (record.status !== 'Present' && new Date(record.date) >= twoWeeksAgo) {
                        if (!recentAttendanceByUser[record.studentId]) {
                           recentAttendanceByUser[record.studentId] = 0;
                        }
                        recentAttendanceByUser[record.studentId]++;
                    }
                });
                risky = allStudents.filter(student => (recentAttendanceByUser[student.studentId] || 0) >= threshold);
            }
            
            setAtRiskStudents(risky);
        };

        findAtRiskStudents();
    }, [dataLoading, allStudents, allAttendance, filterType, threshold, semesterTotalPeriods]);

    const handleFilterTypeChange = (value: FilterType) => {
        setFilterType(value);
        if (value === 'recent_periods') setThreshold(10);
        if (value === 'fixed_periods') setThreshold(20);
        if (value === 'semester_ratio') setThreshold(5); // Default to 1/5
    };

    const studentCounselingRecords = useMemo(() => {
        const recordsByStudent: Record<string, CounselingRecord[]> = {};
        if (!canViewCounselingData || atRiskStudents.length === 0) return recordsByStudent;

        atRiskStudents.forEach(student => {
            recordsByStudent[student.studentId] = allCounseling.filter(r => r.studentId === student.studentId);
        });
        return recordsByStudent;
    }, [atRiskStudents, allCounseling, canViewCounselingData]);

    return (
      <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
                <Wand2 />
                AI 智慧洞察與高風險學生識別
            </CardTitle>
            <CardDescription>系統根據您設定的條件，主動識別出需要關注的學生，並提供 AI 輔導建議。</CardDescription>
          </CardHeader>
          <CardContent>
            <Card className="p-4 mb-6 bg-muted/50">
                <CardTitle className="text-lg mb-2 flex items-center"><SlidersHorizontal className="mr-2"/>篩選條件設定</CardTitle>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div>
                        <Label htmlFor="filterType">篩選規則</Label>
                        <Select value={filterType} onValueChange={(v) => handleFilterTypeChange(v as FilterType)}>
                            <SelectTrigger id="filterType">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="recent_periods">最近兩週缺曠超過 (節)</SelectItem>
                                <SelectItem value="fixed_periods">本學期總缺曠超過 (節)</SelectItem>
                                <SelectItem value="semester_ratio">本學期總缺曠超過 (比例)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                     <div>
                        <Label htmlFor="threshold">觸發閾值</Label>
                        {filterType === 'semester_ratio' ? (
                             <Select value={String(threshold)} onValueChange={(v) => setThreshold(Number(v))}>
                                <SelectTrigger id="threshold"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="5">1/5</SelectItem>
                                    <SelectItem value="4">1/4</SelectItem>
                                    <SelectItem value="3">1/3</SelectItem>
                                </SelectContent>
                            </Select>
                        ) : (
                            <Input id="threshold" type="number" value={threshold} onChange={e => setThreshold(Number(e.target.value))} />
                        )}
                    </div>
                </div>
            </Card>
            
            {dataLoading ? (
                <div className="flex items-center justify-center h-48">
                    <Loader2 className="h-6 w-6 animate-spin" />
                </div>
            ) : (
                <div className="mt-6">
                    <h4 className="font-semibold text-lg">分析結果</h4>
                     <p className="text-sm text-muted-foreground mb-4">共找到 {atRiskStudents.length} 位符合條件的學生。</p>
                    {atRiskStudents.length > 0 ? (
                        <Accordion type="single" collapsible className="w-full">
                            {atRiskStudents.map(student => (
                                <AtRiskStudentItem 
                                    key={student.studentId} 
                                    student={student} 
                                    initialRecords={studentCounselingRecords[student.studentId] || []}
                                    canViewCounselingData={canViewCounselingData}
                                />
                            ))}
                        </Accordion>
                    ) : (
                        <p className="text-center text-muted-foreground p-8">太棒了！目前沒有學生的缺曠狀況達到您設定的警戒標準。</p>
                    )}
                </div>
            )}
          </CardContent>
      </Card>
    )
}

function AtRiskStudentItem({ student, initialRecords, canViewCounselingData }: { student: Student, initialRecords: CounselingRecord[], canViewCounselingData: boolean }) {
    const [isAiLoading, startAiTransition] = useTransition();
    const [suggestions, setSuggestions] = useState<string | null>(null);
    const { toast } = useToast();

    const handleGetSuggestions = () => {
        startAiTransition(async () => {
          try {
            const allNotesText = initialRecords.map(note => `日期: ${note.date}\n類型: ${note.recordType}\n內容:\n${note.notes}`).join('\n\n---\n\n');
            const result = await getInterventionSuggestions(student.studentId, allNotesText);
            setSuggestions(result);
          } catch (error: any) {
            toast({ title: 'AI 建議獲取失敗', description: error.message, variant: 'destructive' });
            setSuggestions('獲取建議時發生錯誤。');
          }
        });
    };

    return (
       <AccordionItem value={student.studentId}>
        <AccordionTrigger>
            <div className="flex items-center gap-3">
                 <AlertTriangle className="h-5 w-5 text-destructive" />
                <span className="font-semibold">{student.name}</span>
                <Badge variant="outline">{student.currentClass || student.className}</Badge>
                <span className="text-sm text-muted-foreground hidden sm:inline">({student.studentId})</span>
                 <Badge variant="destructive">缺曠頻繁</Badge>
            </div>
        </AccordionTrigger>
        <AccordionContent className="p-4 bg-muted/20 rounded-md">
            <div className="grid md:grid-cols-2 gap-6">
                 <div>
                    <h4 className="font-semibold mb-2">AI 輔導建議</h4>
                     <Button onClick={handleGetSuggestions} disabled={isAiLoading || !canViewCounselingData} className="w-full mb-4">
                        <Wand2 className="mr-2 h-4 w-4" />
                        {isAiLoading ? '分析中...' : '產生 AI 建議'}
                    </Button>
                    {!canViewCounselingData && <p className="text-xs text-center text-muted-foreground mt-2">您的權限無法使用此功能。</p>}
                    <InterventionSuggestions suggestions={suggestions} isLoading={isAiLoading} />
                </div>
                 <div>
                    <h4 className="font-semibold mb-2">最近輔導紀錄</h4>
                     {!canViewCounselingData ? (
                        <div className="flex flex-col items-center justify-center text-center text-muted-foreground h-full p-4 border rounded-md bg-background">
                            <Lock className="h-6 w-6 mb-2 text-destructive"/>
                            <p className="font-semibold">權限不足</p>
                            <p className="text-xs">無法載入此學生的輔導紀錄。</p>
                        </div>
                     ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                          {initialRecords.length > 0 ? (
                            initialRecords.slice(0, 5).map((note) => (
                              <div key={note.id} className="p-2 rounded-md border bg-background whitespace-pre-wrap text-xs">
                                <div className="flex justify-between items-center">
                                  <p className="font-semibold">{note.recordType}</p>
                                  <p className="text-muted-foreground">{note.date}</p>
                                </div>
                                <p className="mt-1 truncate">{note.notes}</p>
                              </div>
                            ))
                          ) : (
                            <p className="text-center text-muted-foreground text-sm py-4">尚無輔導紀錄。</p>
                          )}
                        </div>
                     )}
                     <Button asChild variant="link" size="sm" className="mt-2">
                        <Link href={`/students/${student.studentId}`}>查看完整學生資料 &rarr;</Link>
                    </Button>
                </div>
            </div>
        </AccordionContent>
      </AccordionItem>
    )
}
