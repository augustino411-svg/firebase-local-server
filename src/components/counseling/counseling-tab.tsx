
'use client';

import React, { useState, useTransition } from 'react';
import type { CounselingRecord, Student } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { addCounselingRecord, getCounselingRecordsCountForDay, deleteCounselingRecord } from '@/lib/data-client';
import { getInterventionSuggestions } from '@/lib/actions';
import { Wand2, Send, Pencil, Home, Trash2, Loader2, UserCircle } from 'lucide-react';
import InterventionSuggestions from '../students/intervention-suggestions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/context/auth-context';
import { Badge } from '../ui/badge';
import { format } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { getRoleLabel } from '@/lib/utils';

interface CounselingTabProps {
  student: Student;
  initialNotes: CounselingRecord[];
  onRecordChange: () => void;
}

export const COUNSELING_TYPES = {
    'A1': 'A1 保護性-性騷擾',
    'A2': 'A2 保護性-家人性侵',
    'A3': 'A3 保護性-非家人性侵(合意)',
    'A4': 'A4 保護性-非家人性侵(非合意)',
    'A5': 'A5 保護性-性交易',
    'A6': 'A6 保護性-家庭暴力',
    'B':  'B 中離-含長期缺曠課',
    'C1': 'C1 家庭問題-家庭變故',
    'C2': 'C2 家庭問題-家庭關係',
    'D1': 'D1 校園衝突-學生間衝突（含霸凌)',
    'D2': 'D2 校園衝突-師生間衝突',
    'D3': 'D3 校園衝突-親師間衝突',
    'E1': 'E1 心理衛生-性別與情感議題',
    'E2': 'E2 心理衛生-身心疾病(含疑似)',
    'E3': 'E3 心理衛生-自我傷害(含自殘與自殺)',
    'E4': 'E4 心理衛生-情緒困擾',
    'E5': 'E5 心理衛生-拒(懼)學',
    'E6': 'E6 心理衛生-物質濫用',
    'E7': 'E7 心理衛生-人際困擾',
    'F1': 'F1 偏差行為-少年犯罪',
    'F2': 'F2 偏差行為-偏差或違規行為',
    'G1': 'G1 生涯發展-適性輔導',
    'G2': 'G2 生涯發展-學習輔導',
    'H':  'H 其他'
};

export default function CounselingTab({ student, initialNotes, onRecordChange }: CounselingTabProps) {
  const [suggestions, setSuggestions] = useState<string | null>(null);
  const [isAiLoading, startAiTransition] = useTransition();
  const [isSubmitting, startSubmitTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const { permission } = useAuth();
  const { toast } = useToast();

  const canEdit = permission?.role === 'admin' || permission?.role === 'teacher';
  const isViewerOnly = !canEdit;


  const handleAddNote = async (formData: FormData) => {
    if (!canEdit || !permission) {
      toast({ title: '權限不足', description: '您沒有權限新增輔導紀錄。', variant: 'destructive' });
      return;
    }

    const noteText = formData.get('notes') as string;
    const recordType = formData.get('recordType') as '個人談話記錄' | '家庭聯繫紀錄';
    const dateStr = formData.get('date') as string;

    if (!noteText || !noteText.trim()) {
      toast({ title: '錯誤', description: '記事內容不能為空。', variant: 'destructive' });
      return;
    }
    
    startSubmitTransition(async () => {
      try {
        const effectiveClass = student.currentClass || student.className;
        
        const formattedDate = dateStr.replace(/-/g, '');
        const typeAbbreviation = recordType === '個人談話記錄' ? 'P' : 'H';
        const count = await getCounselingRecordsCountForDay(formattedDate, student.studentId, typeAbbreviation) + 1;
        const docId = `${formattedDate}-${student.studentId}-${typeAbbreviation}-${count}`;

        const newRecord: Omit<CounselingRecord, 'id'> = {
            studentId: student.studentId,
            className: effectiveClass,
            recordType: recordType,
            date: dateStr,
            academicYear: formData.get('academicYear') as string,
            semester: formData.get('semester') as string,
            counselingType: formData.get('counselingType') as string,
            notes: noteText,
            inquiryMethod: formData.get('inquiryMethod') as string | undefined,
            contactPerson: formData.get('contactPerson') as string || null,
            visibleToTeacher: formData.get('visibleToTeacher') as 'yes' | 'no' | undefined,
            authorEmail: permission.email,
            authorName: permission.name || permission.email,
            authorRole: permission.role,
        };

        await addCounselingRecord(docId, newRecord);
        onRecordChange(); // Notify parent to refetch
        toast({ title: '成功', description: `${recordType}已新增。` });
        // The form is reset via its ref in the CounselingForm component
      } catch (error: any) {
        toast({ title: '新增失敗', description: error.message, variant: 'destructive' });
      }
    });
  };

  const handleGetSuggestions = () => {
    startAiTransition(async () => {
      try {
        const allNotesText = initialNotes.map(note => `日期: ${note.date}\n類型: ${note.recordType}\n內容:\n${note.notes}`).join('\n\n---\n\n');
        const result = await getInterventionSuggestions(student.studentId, allNotesText);
        setSuggestions(result);
      } catch (error: any) {
        toast({ title: 'AI 建議獲取失敗', description: error.message, variant: 'destructive' });
        setSuggestions('獲取建議時發生錯誤。');
      }
    });
  };
  
  const handleDeleteNote = async (recordId: string) => {
    setIsDeleting(recordId);
    try {
        await deleteCounselingRecord(recordId);
        onRecordChange(); // Notify parent to refetch
        toast({ title: '成功', description: '輔導紀錄已刪除。' });
    } catch(error: any) {
        toast({ title: '刪除失敗', description: error.message, variant: 'destructive' });
    } finally {
        setIsDeleting(null);
    }
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>新增輔導紀錄</CardTitle>
            <CardDescription>記錄新的個人談話或家庭聯繫內容。</CardDescription>
          </CardHeader>
          <CardContent>
             {isViewerOnly ? (
              <div className="text-center text-muted-foreground p-8">您的權限無法新增紀錄。</div>
            ) : (
              <Tabs defaultValue="personal" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="personal"><Pencil className="mr-2 h-4 w-4" />個人談話紀錄</TabsTrigger>
                      <TabsTrigger value="family"><Home className="mr-2 h-4 w-4" />家庭聯繫紀錄</TabsTrigger>
                  </TabsList>
                  <TabsContent value="personal">
                      <CounselingForm type="個人談話記錄" studentName={student.name} onSubmit={handleAddNote} isSubmitting={isSubmitting} />
                  </TabsContent>
                  <TabsContent value="family">
                      <CounselingForm type="家庭聯繫紀錄" studentName={student.name} onSubmit={handleAddNote} isSubmitting={isSubmitting} isFamilyContact={true} />
                  </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>輔導歷史紀錄</CardTitle>
             <CardDescription>此學生過往的輔導紀錄。</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {initialNotes.length > 0 ? (
                initialNotes.map((note) => (
                  <div key={note.id} className="relative p-3 rounded-md border bg-muted/50 whitespace-pre-wrap text-sm group">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{note.recordType}</p>
                          {note.className && <Badge variant="outline">{note.className}</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground">{note.date}</p>
                    </div>
                     <p className="font-semibold text-primary mt-1">{COUNSELING_TYPES[note.counselingType as keyof typeof COUNSELING_TYPES]}</p>
                    <p className="mt-2">{note.notes}</p>
                    <div className="flex items-center justify-end mt-2 pt-2 border-t border-muted-foreground/20">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <UserCircle className="h-3 w-3"/>
                        <span>{`${note.authorName || note.authorEmail} (${getRoleLabel(note.authorRole) || '未知'})`}</span>
                      </div>
                    </div>
                    {canEdit && (
                       <AlertDialog>
                          <AlertDialogTrigger asChild>
                             <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" disabled={isDeleting === note.id}>
                                {isDeleting === note.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>確定要刪除這筆輔導紀錄嗎?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    此操作無法復原，將會永久刪除於 {note.date} 建立的這筆「{note.recordType}」。
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                             <AlertDialogFooter>
                                <AlertDialogCancel>取消</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteNote(note.id)} className="bg-destructive hover:bg-destructive/90">
                                    確認刪除
                                </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                       </AlertDialog>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground">尚無輔導紀錄。</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>AI 智慧洞察</CardTitle>
                <CardDescription>根據輔導歷史紀錄產生介入建議。</CardDescription>
            </CardHeader>
            <CardContent>
                <Button onClick={handleGetSuggestions} disabled={isAiLoading || !canEdit} className="w-full">
                    <Wand2 className="mr-2 h-4 w-4" />
                    {isAiLoading ? '分析中...' : '獲取 AI 建議'}
                </Button>
                {!canEdit && <p className="text-xs text-center text-muted-foreground mt-2">您的權限無法使用此功能。</p>}
            </CardContent>
        </Card>
        
        <InterventionSuggestions suggestions={suggestions} isLoading={isAiLoading} />
      </div>
    </div>
  );
}

interface CounselingFormProps {
    type: '個人談話記錄' | '家庭聯繫紀錄';
    studentName: string;
    onSubmit: (formData: FormData) => void;
    isSubmitting: boolean;
    isFamilyContact?: boolean;
}

function CounselingForm({ type, studentName, onSubmit, isSubmitting, isFamilyContact = false }: CounselingFormProps) {
    const formRef = React.useRef<HTMLFormElement>(null);
    
    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        formData.append('recordType', type);
        onSubmit(formData);
        formRef.current?.reset();
    }
    
    return (
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>學年度</Label>
                    <Input defaultValue="114" name="academicYear" />
                </div>
                <div className="space-y-2">
                    <Label>學期</Label>
                    <Select name="semester" defaultValue="1">
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1">第一學期</SelectItem>
                            <SelectItem value="2">第二學期</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
             <div className="space-y-2">
                <Label>日期</Label>
                <Input type="date" name="date" defaultValue={new Date().toISOString().split('T')[0]} />
            </div>

            {isFamilyContact && (
                <div className="space-y-2">
                    <Label>聯繫者</Label>
                    <Input name="contactPerson" placeholder="請輸入聯繫者姓名" />
                </div>
            )}
            
            <div className="space-y-2">
                <Label>{isFamilyContact ? '訪問方式' : '詢問方式'}</Label>
                <Select name="inquiryMethod">
                    <SelectTrigger><SelectValue placeholder="請選擇..." /></SelectTrigger>
                    <SelectContent>
                        {isFamilyContact ? (
                            <>
                                <SelectItem value="1">1 家庭訪問</SelectItem>
                                <SelectItem value="2">2 電話聯絡</SelectItem>
                                <SelectItem value="3">3 函件聯絡</SelectItem>
                                <SelectItem value="4">4 個別約談家長</SelectItem>
                                <SelectItem value="5">5 舉辦班級家長會談</SelectItem>
                                <SelectItem value="6">6 其他</SelectItem>
                            </>
                        ) : (
                            <>
                                <SelectItem value="1">1 個人訪談</SelectItem>
                                <SelectItem value="2">2 電話連絡</SelectItem>
                                <SelectItem value="3">3 函件聯絡</SelectItem>
                                <SelectItem value="4">4 測驗成績</SelectItem>
                                <SelectItem value="5">5 其他</SelectItem>
                            </>
                        )}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label>是否開放給班導查看</Label>
                <RadioGroup name="visibleToTeacher" defaultValue="yes" className="flex items-center gap-4">
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="r1" />
                        <Label htmlFor="r1">是</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="r2" />
                        <Label htmlFor="r2">否</Label>
                    </div>
                </RadioGroup>
            </div>

            <div className="space-y-2">
                <Label>輔導類型代碼</Label>
                <Select name="counselingType">
                    <SelectTrigger><SelectValue placeholder="請選擇..." /></SelectTrigger>
                    <SelectContent>
                       {Object.entries(COUNSELING_TYPES).map(([code, description]) => (
                           <SelectItem key={code} value={code}>{description}</SelectItem>
                       ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label>記事</Label>
                <Textarea name="notes" placeholder="請在此輸入您的筆記..." rows={5} />
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
                <Send className="mr-2 h-4 w-4" />
                {isSubmitting ? '儲存中...' : `儲存${type}`}
            </Button>
        </form>
    )
}
