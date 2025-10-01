
'use client';

import React, { useState, useEffect, useMemo, useTransition } from 'react';
import type { Student } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, UserCheck, Shuffle, AlertCircle } from 'lucide-react';
import { batchUpdateStudentStatus } from '@/lib/data-client';
import { getStatusText } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useData } from '@/context/data-context';
import { Textarea } from '../ui/textarea';

const STATUS_OPTIONS = [
    { value: '1', label: '一般' },
    { value: '2', label: '休學' },
    { value: '3', label: '退學' },
    { value: '4', label: '畢業' },
];

export default function BatchStatusUpdate() {
    const { students: allStudents, classes, loading: dataLoading, refetchData } = useData();
    const [isSubmitting, startTransition] = useTransition();

    const [filterClass, setFilterClass] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());

    const [newStatusCode, setNewStatusCode] = useState('');
    const [newClassName, setNewClassName] = useState('');
    const [changeNote, setChangeNote] = useState('');
    
    const { toast } = useToast();

    const filteredStudents = useMemo(() => {
        return allStudents.filter(student => {
            const classMatch = filterClass === 'all' || (student.currentClass || student.className) === filterClass;
            const searchMatch = !searchTerm || student.name.includes(searchTerm) || student.studentId.includes(searchTerm);
            return classMatch && searchMatch;
        });
    }, [allStudents, filterClass, searchTerm]);

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

    const handleSubmit = () => {
        if (selectedStudents.size === 0) {
            toast({ title: "錯誤", description: "請至少選取一位學生。", variant: "destructive" });
            return;
        }
        if (!newStatusCode && !newClassName) {
            toast({ title: "錯誤", description: "請至少選擇一項要變更的內容 (學籍狀態或新班級)。", variant: "destructive" });
            return;
        }
        if (!changeNote.trim()) {
            toast({ title: "錯誤", description: "請務必填寫異動原因。", variant: "destructive" });
            return;
        }

        startTransition(async () => {
            try {
                await batchUpdateStudentStatus({  updates: Array.from(selectedStudents).map(studentId => ({studentId,status: newStatusCode,className: newClassName,note: changeNote,}))
                });
                toast({
                    title: '成功',
                    description: `已成功更新 ${selectedStudents.size} 位學生的資料。`,
                });
                refetchData(); // Refresh global data context
                // Reset form
                setSelectedStudents(new Set());
                setNewStatusCode('');
                setNewClassName('');
                setChangeNote('');
            } catch (error: any) {
                toast({
                    title: '更新失敗',
                    description: error.message || '批次更新時發生未知錯誤。',
                    variant: 'destructive',
                });
            }
        });
    }

    const isAllSelected = filteredStudents.length > 0 && selectedStudents.size === filteredStudents.length;
    const isPartiallySelected = selectedStudents.size > 0 && selectedStudents.size < filteredStudents.length;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Shuffle />批次學籍管理</CardTitle>
                <CardDescription>
                    用於批次變更學生的學籍狀態 (如畢業、休學) 或調整班級 (如升級、轉班)。所有變更將會被記錄在學生的歷史異動中。
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                    <h4 className="font-semibold flex items-center"><UserCheck className="mr-2"/>步驟一：選擇要變更的學生</h4>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Select value={filterClass} onValueChange={setFilterClass}>
                            <SelectTrigger className="w-full sm:w-[200px]">
                                <SelectValue placeholder="篩選班級" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">所有班級</SelectItem>
                                {classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <div className="relative w-full sm:max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="依姓名或學號搜尋..."
                                className="pl-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    {dataLoading ? (
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
                                    <TableHead>目前班級</TableHead>
                                    <TableHead>目前學籍</TableHead>
                                </TableRow>
                                </TableHeader>
                                <TableBody>
                                {filteredStudents.length > 0 ? filteredStudents.map(student => (
                                    <TableRow key={student.studentId} data-state={selectedStudents.has(student.studentId) && "selected"}>
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
                    )}
                </div>

                 <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                    <h4 className="font-semibold flex items-center"><Shuffle className="mr-2"/>步驟二：設定要更新的內容</h4>
                     <p className="text-sm text-muted-foreground">對所有已選取的 <b className="text-primary">{selectedStudents.size}</b> 位學生，執行以下變更。留空表示不變更該項。</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                            <label className="text-sm font-medium">變更學籍狀態為</label>
                            <Select value={newStatusCode} onValueChange={setNewStatusCode}>
                                <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="-- 保持不變 --" />
                                </SelectTrigger>
                                <SelectContent>
                                    {STATUS_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium">變更班級為</label>
                            <Select value={newClassName} onValueChange={setNewClassName}>
                                <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="-- 保持不變 --" />
                                </SelectTrigger>
                                <SelectContent>
                                    {classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                     <div>
                        <label className="text-sm font-medium">異動原因 (必填)</label>
                        <Textarea 
                            value={changeNote} 
                            onChange={(e) => setChangeNote(e.target.value)} 
                            placeholder="例如：113學年度升級、轉班、畢業" 
                            className="mt-1"
                        />
                    </div>
                </div>
                 <div className="flex justify-end">
                    <Button onClick={handleSubmit} disabled={isSubmitting || selectedStudents.size === 0}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserCheck className="mr-2 h-4 w-4" />}
                        {isSubmitting ? `更新 ${selectedStudents.size} 位學生中...` : `確認更新 ${selectedStudents.size} 位學生`}
                    </Button>
                </div>

            </CardContent>
        </Card>
    );
}
