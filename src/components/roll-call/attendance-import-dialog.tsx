
'use client';

import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, FileUp, AlertTriangle } from 'lucide-react';
import { batchImportAttendanceRecords } from '@/lib/data-client';
import type { AttendanceRecord, AttendanceStatus } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { format, parse } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';


// Mapping from Excel period values to system period labels
const PERIOD_MAP: Record<string, string> = {
  '10': '第一節',
  '11': '第二節',
  '12': '第三節',
  '13': '第四節',
  '14': '第五節',
};

// Mapping from Excel absence types to system AttendanceStatus
const STATUS_MAP: Record<string, AttendanceStatus> = {
  '曠課': 'Absent',
  '病假': 'Sick',
  '事假': 'Personal',
  '遲到': 'Late',
  '公假': 'Official',
  '生理假': 'Menstrual',
  '喪假': 'Bereavement',
};


export default function AttendanceImportDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<Omit<AttendanceRecord, 'id' | 'studentName'>[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const resetState = () => {
    setFile(null);
    setPreviewData([]);
    setIsParsing(false);
    setIsSubmitting(false);
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setIsParsing(true);
    setPreviewData([]);

    try {
        const data = await selectedFile.arrayBuffer();
        const workbook = XLSX.read(data);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet);

        const parsedRecords: Omit<AttendanceRecord, 'id' | 'studentName'>[] = [];

        for (const row of json) {
            const studentId = String(row['學號']);
            const className = String(row['開課班級'] || row['學生班級']);
            const dateString = String(row['日期']);
            const periodValue = String(row['節次']);
            const statusValue = String(row['假别']);
            
            // Skip if essential data is missing
            if (!studentId || !className || !dateString || !periodValue || !statusValue) continue;

            const period = PERIOD_MAP[periodValue];
            const status = STATUS_MAP[statusValue];

            // Skip if mapping is not found
            if (!period || !status) continue;
            
            // Handle Excel's numeric date format or string format
            let date: Date;
            if (typeof row['日期'] === 'number') {
               date = XLSX.SSF.parse_date_code(row['日期']);
            } else {
               // Assuming format YYYY/MM/DD
               date = parse(dateString, 'yyyy/MM/dd', new Date());
            }

            if (isNaN(date.getTime())) continue; // Skip invalid dates


            parsedRecords.push({
                studentId,
                className,
                date: format(date, 'yyyy-MM-dd'),
                period,
                status
            });
        }
        
        if (parsedRecords.length === 0) {
            toast({
                title: "無有效資料",
                description: "在您上傳的檔案中，找不到可供匯入的有效缺曠紀錄。",
                variant: "destructive"
            });
        }

        setPreviewData(parsedRecords);

    } catch (error) {
        console.error("Error parsing Excel file:", error);
        toast({ title: '檔案解析失敗', description: '請確認檔案格式是否正確。', variant: 'destructive' });
        resetState();
    } finally {
        setIsParsing(false);
    }
  };
  
  const handleSubmit = async () => {
    if (previewData.length === 0) {
        toast({ title: '沒有可匯入的資料', description: '請先上傳並預覽檔案。', variant: 'destructive' });
        return;
    }
    setIsSubmitting(true);
    try {
        await batchImportAttendanceRecords(previewData);
        toast({
            title: "匯入成功",
            description: `已成功匯入 ${previewData.length} 筆缺曠紀錄。`,
        });
        setIsOpen(false);
        resetState();
    } catch (error: any) {
        console.error("Error during batch import:", error);
        toast({ title: '匯入失敗', description: error.message, variant: 'destructive' });
    } finally {
        setIsSubmitting(false);
    }

  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if(!open) resetState();
      setIsOpen(open);
    }}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FileUp className="mr-2 h-4 w-4" />
          匯入缺曠紀錄
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>從 Excel 匯入缺曠紀錄</DialogTitle>
          <DialogDescription>
            選擇從學校系統下載的 Excel 檔案，系統將會解析並批次匯入缺曠資料。
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
             <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>重要提示</AlertTitle>
                <AlertDescription>
                    匯入操作將會以檔案內容為準，**覆蓋**資料庫中對應日期、學生與節次的現有紀錄。請謹慎操作。
                </AlertDescription>
            </Alert>
            <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="excel-file">1. 選擇 Excel 檔案</Label>
                <Input id="excel-file" type="file" accept=".xls,.xlsx" onChange={handleFileChange} disabled={isParsing} />
            </div>

            {isParsing ? (
                <div className="flex justify-center items-center h-48"><Loader2 className="animate-spin h-8 w-8" /></div>
            ) : previewData.length > 0 && (
                <div className="space-y-2">
                    <Label>2. 預覽待匯入資料 (前 10 筆)</Label>
                    <div className="rounded-md border max-h-64 overflow-y-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>班級</TableHead>
                                    <TableHead>學號</TableHead>
                                    <TableHead>日期</TableHead>
                                    <TableHead>節次</TableHead>
                                    <TableHead>假別</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {previewData.slice(0, 10).map((record, i) => (
                                    <TableRow key={i}>
                                        <TableCell>{record.className}</TableCell>
                                        <TableCell>{record.studentId}</TableCell>
                                        <TableCell>{record.date}</TableCell>
                                        <TableCell>{record.period}</TableCell>
                                        <TableCell>{Object.entries(STATUS_MAP).find(([, val]) => val === record.status)?.[0]}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    <p className="text-sm text-muted-foreground">共找到 {previewData.length} 筆有效紀錄可供匯入。</p>
                </div>
            )}
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={isSubmitting || isParsing || previewData.length === 0}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            {isSubmitting ? '匯入中...' : `確認匯入 ${previewData.length} 筆紀錄`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
