

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Database, Loader2, Download, AlertTriangle, CheckCircle, Upload, FileJson } from 'lucide-react';
import { format } from 'date-fns';
import { exportAllData, restoreDataFromJson } from '@/lib/data-client';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Input } from '../ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';


export default function DatabaseSettings() {
    const { toast } = useToast();
    const [isExporting, setIsExporting] = useState(false);
    const [lastExportResult, setLastExportResult] = useState<{ success: boolean; failed: string[] } | null>(null);
    
    const [isRestoring, setIsRestoring] = useState(false);
    const [restoreFile, setRestoreFile] = useState<File | null>(null);
    const [confirmationText, setConfirmationText] = useState('');

    const handleDownload = async () => {
        setIsExporting(true);
        setLastExportResult(null);
        toast({ title: '請稍候', description: '正在從資料庫匯出所有資料...' });
        try {
            const result = await exportAllData();
            if (result.success) {
                const jsonString = JSON.stringify(result.data, null, 2);
                const blob = new Blob([jsonString], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `smcs-backup-${format(new Date(), 'yyyyMMddHHmm')}.json`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                toast({ title: '匯出成功', description: '資料庫備份檔案已開始下載。' });
            } else {
                 toast({ title: '匯出失敗', description: '部分資料集合匯出失敗。', variant: 'destructive' });
            }
            setLastExportResult({ success: result.success, failed: result.failedCollections });
        } catch (error: any) {
            toast({ title: '匯出錯誤', description: error.message, variant: 'destructive' });
        } finally {
            setIsExporting(false);
        }
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setRestoreFile(e.target.files[0]);
        } else {
            setRestoreFile(null);
        }
    }

    const handleRestore = async () => {
        if (!restoreFile) {
            toast({ title: '錯誤', description: '請先選擇一個備份檔案。', variant: 'destructive' });
            return;
        }
        setIsRestoring(true);
        toast({ title: '請稍候', description: '正在還原資料庫，請勿關閉此頁面...' });
        
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const jsonString = event.target?.result as string;
                const result = await restoreDataFromJson(jsonString);
                if (result.success) {
                    toast({ title: '還原成功', description: `成功還原 ${result.collectionCount} 個集合，共 ${result.documentCount} 筆文件。頁面將會重新整理。` });
                    setTimeout(() => window.location.reload(), 2000);
                } else {
                    toast({ title: '還原失敗', description: result.message, variant: 'destructive' });
                }
            } catch (err: any) {
                toast({ title: '還原錯誤', description: err.message || '讀取或解析檔案時發生錯誤。', variant: 'destructive' });
            } finally {
                setIsRestoring(false);
                setConfirmationText('');
                setRestoreFile(null);
            }
        };
        reader.onerror = () => {
            toast({ title: '檔案讀取失敗', description: '無法讀取所選的檔案。', variant: 'destructive' });
            setIsRestoring(false);
        };
        reader.readAsText(restoreFile);
    };


    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                     <CardTitle className="flex items-center gap-2">
                        <Database className="mr-2 h-5 w-5" />資料庫備份與還原
                    </CardTitle>
                    <CardDescription>
                        此處提供資料庫的完整備份與還原功能。請謹慎操作，特別是還原功能，它將會覆蓋現有資料。
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Backup */}
                    <div className="p-6 border rounded-lg bg-background flex flex-col items-center justify-between text-center gap-4">
                        <h4 className="font-semibold text-lg">系統全資料下載</h4>
                        <p className="text-sm text-muted-foreground">將系統內所有可存取的資料集合打包成一個 JSON 檔案下載備份。若有權限問題，部分集合可能被跳過。</p>
                        
                        {lastExportResult && (
                            lastExportResult.success ? (
                                <Alert variant="default" className="text-left">
                                    <CheckCircle className="h-4 w-4" />
                                    <AlertTitle>上次匯出成功</AlertTitle>
                                    <AlertDescription>
                                        所有可存取集合均已成功匯出。
                                    </AlertDescription>
                                </Alert>
                            ) : (
                                <Alert variant="destructive" className="text-left">
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertTitle>上次匯出包含失敗項目</AlertTitle>
                                    <AlertDescription>
                                        以下集合未能成功匯出: {lastExportResult.failed.join(', ')}
                                    </AlertDescription>
                                </Alert>
                            )
                        )}

                        <Button onClick={handleDownload} disabled={isExporting} className="w-full mt-auto">
                            {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                            {isExporting ? '匯出中...' : '下載備份'}
                        </Button>
                    </div>

                    {/* Restore */}
                    <div className="p-6 border rounded-lg bg-background flex flex-col items-center justify-between text-center gap-4">
                        <h4 className="font-semibold text-lg text-destructive">從備份檔案還原</h4>
                         <p className="text-sm text-muted-foreground">從先前下載的 .json 備份檔案還原資料。此操作將會**覆蓋**所有對應的現有資料。</p>
                        
                        <div className="w-full space-y-2">
                             <Input id="restore-file" type="file" accept=".json" onChange={handleFileChange} disabled={isRestoring} />
                        </div>

                        <AlertDialog onOpenChange={() => setConfirmationText('')}>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" disabled={!restoreFile || isRestoring} className="w-full mt-auto">
                                    {isRestoring ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                    {isRestoring ? '還原中...' : '開始還原'}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="text-destructive text-2xl">⚠️ 危險操作警告 ⚠️</AlertDialogTitle>
                                    <AlertDialogDescription className="text-base">
                                        這是一個無法復原的破壞性操作。它將會用檔案 `({restoreFile?.name})` 的內容，**完全覆蓋**現有的資料庫。
                                        <br/><br/>
                                        為確保您了解此操作的嚴重性，請在下方的輸入框中輸入「**{`我確定要還原`}**」以啟用還原按鈕。
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <Input
                                    type="text"
                                    placeholder="請在此輸入確認文字"
                                    value={confirmationText}
                                    onChange={(e) => setConfirmationText(e.target.value)}
                                    className="mt-4"
                                />
                                <AlertDialogFooter>
                                    <AlertDialogCancel>取消</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleRestore}
                                        disabled={confirmationText !== `我確定要還原` || isRestoring}
                                        className="bg-destructive hover:bg-destructive/90"
                                    >
                                        {isRestoring ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                        我了解後果，確認還原
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
