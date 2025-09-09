

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import type { Student } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, UserX, Trash2, AlertTriangle } from 'lucide-react';
import { getStatusText } from '@/lib/utils';
import { deleteStudentsByIds } from '@/lib/data-client';
import { useData } from '@/context/data-context';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export default function DeleteStudents() {
    const { students: allStudents, loading: dataLoading, refetchData } = useData();
    const [isDeleting, setIsDeleting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
    const [confirmationText, setConfirmationText] = useState('');
    const { toast } = useToast();

    const filteredStudents = useMemo(() => {
        if (!searchTerm) return [];
        return allStudents.filter(
            (student) =>
              student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
              (student.nationalId && student.nationalId.toLowerCase().includes(searchTerm.toLowerCase()))
          );
      }, [allStudents, searchTerm]);

    const handleSelectAll = (checked: boolean | 'indeterminate') => {
        if (checked === true) {
          const allIds = new Set(filteredStudents.map(s => s.studentId));
          setSelectedStudents(allIds);
        } else {
          setSelectedStudents(new Set());
        }
    };
    
    const handleSelectStudent = (studentId: string, checked: boolean) => {
        const newSelection = new Set(selectedStudents);
        if (checked) {
          newSelection.add(studentId);
        } else {
          newSelection.delete(studentId);
        }
        setSelectedStudents(newSelection);
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const result = await deleteStudentsByIds(Array.from(selectedStudents));
            if (result.success) {
                toast({
                    title: '成功',
                    description: `已成功刪除 ${result.count} 位學生的資料。`,
                });
                refetchData(); // Refresh global data context
                setSelectedStudents(new Set());
                setSearchTerm('');
            } else {
                toast({
                    title: '刪除失敗',
                    description: result.message,
                    variant: 'destructive',
                });
            }
        } catch (error: any) {
            toast({
                title: '發生錯誤',
                description: error.message || '刪除學生時發生未知錯誤。',
                variant: 'destructive',
            });
        } finally {
            setIsDeleting(false);
        }
    }

    const isAllSelected = filteredStudents.length > 0 && selectedStudents.size === filteredStudents.length;
    const isPartiallySelected = selectedStudents.size > 0 && selectedStudents.size < filteredStudents.length;

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center"><UserX className="mr-2 h-5 w-5" />刪除學生資料</h3>
            <Card className="bg-muted/30">
                 <CardContent className="pt-6 space-y-4">
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>危險操作區域</AlertTitle>
                        <AlertDescription>
                            此操作將會永久刪除學生的主要資料紀錄，且**無法復原**。此操作目前**不會**自動刪除關聯的出缺勤或輔導紀錄。請謹慎操作。
                        </AlertDescription>
                    </Alert>
                    <div className="relative sm:max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="依姓名、學號或身分證號搜尋以顯示學生..."
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {searchTerm && (
                        dataLoading ? (
                            <div className="flex justify-center items-center h-24"><Loader2 className="animate-spin h-6 w-6" /></div>
                        ) : (
                            <div className="rounded-md border max-h-96 overflow-y-auto">
                                <Table>
                                    <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12">
                                            <Checkbox 
                                                onCheckedChange={handleSelectAll} 
                                                checked={isAllSelected || (isPartiallySelected ? 'indeterminate' : false)}
                                                aria-label="選取全部"
                                            />
                                        </TableHead>
                                        <TableHead>學生姓名</TableHead>
                                        <TableHead>學號</TableHead>
                                        <TableHead>班級</TableHead>
                                        <TableHead>學籍狀態</TableHead>
                                    </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                    {filteredStudents.length > 0 ? filteredStudents.map(student => (
                                        <TableRow key={student.studentId}>
                                        <TableCell>
                                            <Checkbox 
                                                checked={selectedStudents.has(student.studentId)}
                                                onCheckedChange={(checked) => handleSelectStudent(student.studentId, !!checked)}
                                                aria-label={`選取 ${student.name}`}
                                            />
                                        </TableCell>
                                        <TableCell>{student.name}</TableCell>
                                        <TableCell>{student.studentId}</TableCell>
                                        <TableCell>{student.currentClass || student.className}</TableCell>
                                        <TableCell>{getStatusText(student.statusCode)}</TableCell>
                                        </TableRow>
                                    )) : (
                                         <TableRow>
                                            <TableCell colSpan={5} className="text-center h-24">
                                                找不到符合搜尋條件的學生。
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    </TableBody>
                                </Table>
                            </div>
                        )
                    )}

                    <AlertDialog onOpenChange={() => setConfirmationText('')}>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" disabled={selectedStudents.size === 0 || isDeleting}>
                                 {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                                {isDeleting ? '刪除中...' : `刪除選取的 ${selectedStudents.size} 位學生`}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle className="text-destructive text-2xl">⚠️ 您確定要永久刪除嗎？ ⚠️</AlertDialogTitle>
                                <AlertDialogDescription className="text-base">
                                    您即將永久刪除 <b>{selectedStudents.size}</b> 位學生的資料。這是一個無法復原的動作。
                                    <br/><br/>
                                    為確保您了解此操作的嚴重性，請在下方的輸入框中輸入「**{`我確定要刪除`}**」以啟用刪除按鈕。
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
                                <AlertDialogAction onClick={handleDelete} disabled={confirmationText !== `我確定要刪除` || isDeleting} className="bg-destructive hover:bg-destructive/90">
                                     {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    我了解後果，確認刪除
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                </CardContent>
            </Card>
        </div>
    );
}
