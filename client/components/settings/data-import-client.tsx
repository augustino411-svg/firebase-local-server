

'use client';

import React, { useState } from 'react';
import type { Student } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UploadCloud, FileSpreadsheet, Loader2, CheckCircle, AlertTriangle, XCircle, Download, PlusCircle, UserCheck } from 'lucide-react';
import { previewStudentsFromExcel, commitStudentImport } from '@/lib/data-client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';


type StudentPreview = Partial<Student> & { importStatus: 'new' | 'existing' };

type ImportStep = 'upload' | 'preview' | 'importing' | 'finished';

const TEMPLATE_HEADERS = [
  "學號", "身分證字號", "姓名", "英文姓名", "性別", "出生日期", "出生地", "部別", "課程適用年度", "學制",
  "班群代碼", "在學狀態代碼", "班級代碼", "班級名稱", "學生座號", "特殊身份代碼", "學籍狀態代碼", "電子信箱",
  "學生行動電話", "血型", "山地平地", "原住民族別", "戶籍地郵區", "戶籍地址", "戶籍地電話", "通訊地郵區",
  "通訊地址", "通訊地電話", "監護人姓名", "監護人關係", "家長職業別", "監護人行動電話", "母親行動電話",
  "父親行動電話", "畢業學校", "入學管道", "新生教育程度", "入學成績-國文", "入學成績-英語", "入學成績-數學",
  "入學成績-社會", "入學成績-自然", "入學成績-寫作"
];


export default function DataImportClient() {
    const { toast } = useToast();
    const router = useRouter();
    
    const [step, setStep] = useState<ImportStep>('upload');
    const [uploadMode, setUploadMode] = useState<'overwrite' | 'add'>('add');
    const [previewData, setPreviewData] = useState<StudentPreview[]>([]);
    const [fileBase64, setFileBase64] = useState<string>('');
    const [fileName, setFileName] = useState('');
    const [error, setError] = useState<string | null>(null);
    
    const [isParsing, setIsParsing] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsParsing(true);
        setError(null);
        setFileName(file.name);

        const reader = new FileReader();
        reader.onload = async (e) => {
            const data = e.target?.result;
            if (typeof data !== 'string') {
                setError('無法讀取檔案內容。');
                setIsParsing(false);
                return;
            }
            
            setFileBase64(data.split(',')[1]);

            try {
                const result = await previewStudentsFromExcel(data.split(',')[1]);
                if (result.success && result.data) {
                    setPreviewData(result.data.map(s => ({ ...s, importStatus: s.importStatus ?? 'new' })));
                    setStep('preview');
                } else {
                    setError(result.message || '從 Excel 預覽學生資料失敗。');
                }
            } catch (err: any) {
                setError(err.message || '預覽時發生未知錯誤。');
            } finally {
                setIsParsing(false);
            }
        };
        reader.onerror = () => {
            setError('讀取檔案時發生錯誤。');
            setIsParsing(false);
        };
        reader.readAsDataURL(file);
    };
    
    const handleConfirmImport = async () => {
        setIsImporting(true);
        setError(null);
        try {
            const result = await commitStudentImport(previewData, uploadMode);
             if (result.success) {
                toast({
                    title: '匯入成功',
                    description: `成功匯入或更新了 ${result.count} 筆學生資料。`,
                });
                setStep('finished');
             } else {
                 setError(result.message);
                 toast({
                    title: '匯入失敗',
                    description: result.message,
                    variant: 'destructive',
                });
             }
        } catch (err: any) {
            setError(err.message || '匯入時發生未知錯誤。');
             toast({
                title: '匯入失敗',
                description: err.message || '發生未知錯誤。',
                variant: 'destructive',
            });
        } finally {
            setIsImporting(false);
        }
    }
    
    const handleReset = () => {
        setStep('upload');
        setPreviewData([]);
        setFileName('');
        setFileBase64('');
        setError(null);
        setIsParsing(false);
        setIsImporting(false);
    }
    
    const handleDownloadTemplate = () => {
        try {
            const ws_data = [
              TEMPLATE_HEADERS,
              ["113001", "A123456789", "王大明", "David Wang", "1", "2008-05-10", "台灣省", "日", "113", "1", "101", "1", "1", "資一甲", "1", "0", "1", "student@example.com", "0912345678", "O", "0", "01", "320", "桃園市中壢區", "034521111", "320", "桃園市中壢區", "034521111", "監護人姓名", "父", "商", "0911111111", "0922222222", "0933333333", "啟英國中", "01", "21"]
            ];
            const ws = XLSX.utils.aoa_to_sheet(ws_data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "學生資料範本");
            XLSX.writeFile(wb, "學生資料匯入範本.xlsx");
             toast({ title: '成功', description: '範本檔案已開始下載。'});
        } catch (error) {
            console.error(error);
            toast({ title: '錯誤', description: '產生範本檔案時發生錯誤。', variant: 'destructive'});
        }
    };

    const renderUploadStep = () => (
        <div className="border-2 border-dashed border-muted-foreground/50 rounded-lg p-12 text-center">
            <div className="mx-auto w-fit bg-muted p-4 rounded-full mb-4">
                <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">請上傳您的 Excel 檔案</h3>
            <p className="text-sm text-muted-foreground mb-4">將檔案拖曳至此，或點擊按鈕選擇檔案。</p>
            <Button asChild className="mb-2">
                <label
                  htmlFor="student-upload-file"
                  className="mb-2 w-full flex items-center justify-center px-4 py-2 border rounded-md cursor-pointer hover:bg-gray-100"
                >
                  {isParsing ? (
                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <UploadCloud className="mr-2 h-4 w-4" />
                  )}
                  {isParsing ? "解析中..." : "選擇檔案"}
                  <input
                    id="student-upload-file"
                    type="file"
                    className="sr-only"
                    onChange={handleFileChange}
                    accept=".xls,.xlsx"
                    disabled={isParsing}
                  />
                </label>

            </Button>
            <p className="text-xs text-muted-foreground">
                或點此<Button variant="link" size="sm" onClick={handleDownloadTemplate} className="p-0 h-auto -translate-y-px"><Download className="mr-1 h-3 w-3"/>下載範本檔案</Button>以確保格式正確。
            </p>
        </div>
    );

    const renderPreviewStep = () => (
        <div className="space-y-6">
            <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>預覽與確認</AlertTitle>
                <AlertDescription>
                   系統已預覽您的檔案「{fileName}」，共找到 {previewData.length} 筆資料。請選擇匯入模式並確認下方的預覽內容是否正確。
                </AlertDescription>
            </Alert>
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                    <Label htmlFor="upload-mode">匯入模式</Label>
                    <Select value={uploadMode} onValueChange={(v) => setUploadMode(v as 'overwrite' | 'add')}>
                        <SelectTrigger id="upload-mode" className="w-[180px] mt-1">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="add">新增與更新</SelectItem>
                            <SelectItem value="overwrite">完全覆蓋</SelectItem>
                        </SelectContent>
                    </Select>
                     <p className="text-xs text-muted-foreground mt-1">
                        {uploadMode === 'add' ? '新增新學生，更新已存在學生資料。' : '刪除所有現有學生，再匯入新資料。'}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleReset}>返回重新上傳</Button>
                    <Button onClick={handleConfirmImport} disabled={isImporting}>
                        {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <UserCheck className="mr-2 h-4 w-4"/>}
                        確認並開始匯入
                    </Button>
                </div>
            </div>
            <div className="rounded-md border max-h-[400px] overflow-y-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>狀態</TableHead>
                            <TableHead>學號</TableHead>
                            <TableHead>姓名</TableHead>
                            <TableHead>班級</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {previewData.map((student, index) => (
                            <TableRow key={index}>
                                <TableCell>
                                    <Badge variant={student.importStatus === 'new' ? 'default' : 'secondary'}>
                                        {student.importStatus === 'new' ? '新學生' : '已存在'}
                                    </Badge>
                                </TableCell>
                                <TableCell>{student.studentId}</TableCell>
                                <TableCell>{student.name}</TableCell>
                                <TableCell>{student.className}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
    
    const renderFinishedStep = () => (
        <div className="text-center p-12">
             <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
             <h3 className="text-xl font-bold">匯入完成</h3>
             <p className="text-muted-foreground mb-6">學生資料已成功更新。</p>
             <div className="flex gap-4 justify-center">
                <Button onClick={() => router.push('/students')}>前往學生資料庫</Button>
                <Button variant="outline" onClick={handleReset}>匯入另一個檔案</Button>
             </div>
        </div>
    );

    const renderErrorStep = () => (
         <div className="text-center p-12">
             <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
             <h3 className="text-xl font-bold">發生錯誤</h3>
             <p className="text-muted-foreground mb-6 break-words">{error}</p>
             <Button variant="outline" onClick={handleReset}>返回並重試</Button>
        </div>
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <UploadCloud />
                    學生資料匯入 (Excel)
                </CardTitle>
                <CardDescription>
                   從 Excel 檔案匯入學生資料。此流程包含預覽步驟，讓您在實際寫入資料庫前確認內容。請下載範本檔案以確保格式正確。
                </CardDescription>
            </CardHeader>
            <CardContent>
                {error && renderErrorStep()}
                {!error && step === 'upload' && renderUploadStep()}
                {!error && step === 'preview' && renderPreviewStep()}
                {!error && step === 'finished' && renderFinishedStep()}
            </CardContent>
        </Card>
    );
}
