
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { format, differenceInDays, parseISO, isValid } from 'date-fns';
import { CalendarIcon, Loader2, Download, Save, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { getSettings, saveSettings } from '@/lib/data-client';
import { holidays114, workdays114 } from '@/lib/holidays-tw';
import { Modifiers } from 'react-day-picker';

export default function SemesterSettingsCard() {
  const [holidays, setHolidays] = useState<Date[]>([]);
  const [academicYear, setAcademicYear] = useState('114');
  const [semester, setSemester] = useState('1');
  const [semesterStartDate, setSemesterStartDate] = useState<Date | undefined>();
  const [semesterEndDate, setSemesterEndDate] = useState<Date | undefined>();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      try {
        const settings = await getSettings(academicYear);
        if (settings) {
          setSemester(settings.semester || '1');
          const parsedStartDate = settings.startDate ? parseISO(settings.startDate) : undefined;
          const parsedEndDate = settings.endDate ? parseISO(settings.endDate) : undefined;
          const parsedHolidays = settings.holidays ? settings.holidays.map((d:string) => parseISO(d)).filter(isValid) : [];
          setSemesterStartDate(isValid(parsedStartDate) ? parsedStartDate : undefined);
          setSemesterEndDate(isValid(parsedEndDate) ? parsedEndDate : undefined);
          setHolidays(parsedHolidays);
        } else {
          setHolidays([]);
          setSemester('1');
          setSemesterStartDate(undefined);
          setSemesterEndDate(undefined);
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
        toast({
          title: '錯誤',
          description: '無法載入設定，將使用預設值。',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };
    loadSettings();
  }, [academicYear, toast]);

  const semesterWorkDays = useMemo(() => {
    if (!semesterStartDate || !semesterEndDate || !isValid(semesterStartDate) || !isValid(semesterEndDate) || semesterEndDate < semesterStartDate) {
      return 0;
    }
    const totalDays = differenceInDays(semesterEndDate, semesterStartDate) + 1;
    const holidaySet = new Set(holidays.map(h => format(h, 'yyyy-MM-dd')));
    let workDays = 0;
    for (let i = 0; i < totalDays; i++) {
      const currentDate = new Date(semesterStartDate);
      currentDate.setDate(semesterStartDate.getDate() + i);
      const dayOfWeek = currentDate.getDay();
      const dateString = format(currentDate, 'yyyy-MM-dd');
      if (dayOfWeek >= 1 && dayOfWeek <= 5 && !holidaySet.has(dateString)) {
        workDays++;
      }
    }
    return workDays;
  }, [semesterStartDate, semesterEndDate, holidays]);

    const handleDayClick = (day: Date, modifiers: Modifiers) => {
    if (modifiers.selected) {
      setHolidays(prev =>
        prev.filter(d => format(d, 'yyyy-MM-dd') !== format(day, 'yyyy-MM-dd'))
      );
    } else {
      setHolidays(prev => [...prev, day]);
    }
  };


  const handleDeleteHoliday = (dayToRemove: Date) => {
    setHolidays(prev => prev.filter(d => format(d, 'yyyy-MM-dd') !== format(dayToRemove, 'yyyy-MM-dd')));
  };

  const handleLoadHolidays = () => {
    const holidayDates = holidays114.map(d => parseISO(d));
    const workdayDates = workdays114.map(d => parseISO(d));

    const holidaySet = new Set(holidayDates.map(d => d.getTime()));
    const workdaySet = new Set(workdayDates.map(d => d.getTime()));
    const currentHolidaySet = new Set(holidays.map(d => d.getTime()));

    holidaySet.forEach(time => currentHolidaySet.add(time));
    workdaySet.forEach(time => currentHolidaySet.delete(time));

    const mergedHolidays = Array.from(currentHolidaySet).map(time => new Date(time));
    setHolidays(mergedHolidays);
    toast({ title: '成功', description: '已載入 114 學年度國定假日並移除補班日。' });
  };

  const handleSubmitSettings = async () => {
    if (!academicYear) {
      toast({ title: '錯誤', description: '學年度為必填欄位。', variant: 'destructive' });
      return;
    }
    setIsSaving(true);
    try {
      const settings = {
        academicYear,
        semester,
        label: `${academicYear}學年度第${semester}學期`,
        startDate: semesterStartDate && isValid(semesterStartDate) ? format(semesterStartDate, 'yyyy-MM-dd') : null,
        endDate: semesterEndDate && isValid(semesterEndDate) ? format(semesterEndDate, 'yyyy-MM-dd') : null,
        holidays: holidays.map(d => format(d, 'yyyy-MM-dd')),
      }
      await saveSettings(academicYear, settings);
      toast({
        title: '儲存成功',
        description: `${settings.label} 的設定已成功更新。`,
      });
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast({
        title: '儲存失敗',
        description: '無法儲存設定，請稍後再試。',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if(isLoading){
    return (
        <Card>
            <CardHeader>
                <CardTitle>學期設定</CardTitle>
                <CardDescription>管理學年度、學期、假日。變更學年度後會自動載入該年度設定。</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-center h-48">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>學期設定</CardTitle>
        <CardDescription>管理學年度、學期、假日。變更學年度後會自動載入該年度設定。</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="academic-year">學年度</Label>
              <Input id="academic-year" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} placeholder="例如：114" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="semester">學期</Label>
              <Select value={semester} onValueChange={setSemester}>
                <SelectTrigger id="semester">
                  <SelectValue placeholder="選擇學期" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">第一學期</SelectItem>
                  <SelectItem value="2">第二學期</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">日期與假日設定</h3>
          <CardDescription>
            請點選日期以設定為假日或非假日。假日將不會被納入到課率統計。
          </CardDescription>
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-6 items-start">
              <Calendar
                mode="multiple"
                selected={holidays}
                onDayClick={handleDayClick}
                className="rounded-md border self-center lg:self-start"
              />
              <div className="w-full lg:flex-1 space-y-6">
                <div className="space-y-2">
                  <Label>學期開始日期</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={'outline'}
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !semesterStartDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {semesterStartDate && isValid(semesterStartDate) ? format(semesterStartDate, 'PPP') : <span>選擇日期</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={semesterStartDate} onSelect={setSemesterStartDate} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>學期結束日期</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={'outline'}
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !semesterEndDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {semesterEndDate && isValid(semesterEndDate) ? format(semesterEndDate, 'PPP') : <span>選擇日期</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={semesterEndDate} onSelect={setSemesterEndDate} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
                {semesterStartDate && semesterEndDate && isValid(semesterStartDate) && isValid(semesterEndDate) && semesterEndDate >= semesterStartDate && (
                  <div className="pt-2 text-sm text-muted-foreground">
                    學期總上課天數 (扣除週六日與假日): <span className="font-bold text-primary">{semesterWorkDays}</span> 天
                  </div>
                )}
                <Button variant="outline" onClick={handleLoadHolidays} className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  載入 114 學年度國定假日
                </Button>
                <div className="w-full">
                  <h4 className="font-medium mb-2 text-center">已選取的假日</h4>
                  <div className="p-4 bg-muted rounded-md min-h-[150px] max-h-48 overflow-y-auto">
                    {holidays.length > 0 ? (
                      <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                        {holidays
                          .slice()
                          .sort((a, b) => a.getTime() - b.getTime())
                          .map(day => (
                            <li key={day.toISOString()} className="flex items-center justify-between bg-background p-2 rounded-md shadow-sm">
                              <span>{format(day, 'yyyy-MM-dd')}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 text-muted-foreground hover:text-destructive"
                                onClick={() => handleDeleteHoliday(day)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </li>
                          ))}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground text-center pt-4">尚未選取任何假日。</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSubmitSettings} disabled={isSaving || isLoading}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isSaving ? '儲存中...' : '儲存學期設定'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
