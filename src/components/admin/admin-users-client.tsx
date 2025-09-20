
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { addUser, updateUser, deleteUser } from '@/lib/data-client';
import type { UserWithRole, UserRole } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Users, PlusCircle, Trash2, Save, Eye, EyeOff } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Checkbox } from '../ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { Badge } from '../ui/badge';
import { useData } from '@/context/data-context';
import { Label } from '../ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
    { value: 'admin', label: '管理者' },
    { value: 'teacher', label: '導師' },
    { value: 'part-time', label: '兼課老師' },
];

export default function AdminUsersClient() {
  const { toast } = useToast();
  const { classes: allAvailableClasses, users, loading: dataLoading, refetchData } = useData();
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // For inline editing
  const [editingUsers, setEditingUsers] = useState<Record<string, Partial<UserWithRole>>>({});
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  // For new user form
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserCode, setNewUserCode] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('part-time');
  const [newUserClasses, setNewUserClasses] = useState<string[]>([]);

  const handleAddNewUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail || !newUserCode || !newUserRole) {
      toast({ title: "錯誤", description: "所有欄位皆為必填。", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await addUser({
        name: newUserName,
        email: newUserEmail,
        code: newUserCode,
        role: newUserRole,
        assignedClasses: newUserRole === 'teacher' ? newUserClasses : [],
      });
      
      if(result.success) {
        toast({ title: "成功", description: `使用者 ${newUserName} 已成功新增。` });
        // Reset form
        setNewUserName('');
        setNewUserEmail('');
        setNewUserCode('');
        setNewUserRole('part-time');
        setNewUserClasses([]);
        await refetchData(); // Refresh global data context
      } else {
        toast({ title: "新增失敗", description: result.message || '發生未知錯誤', variant: "destructive" });
      }

    } catch (error: any) {
      toast({ title: "新增失敗", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInlineChange = (userId: string, field: keyof UserWithRole, value: any) => {
    setEditingUsers(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [field]: value
      }
    }));
  };

   const handleMultiClassChange = (userId: string, classname: string, checked: boolean) => {
    setEditingUsers(prev => {
      const currentUserClasses = prev[userId]?.assignedClasses ?? users.find(u => u.id === userId)?.assignedClasses ?? [];
      let newClasses;
      if (checked) {
        newClasses = [...currentUserClasses, classname];
      } else {
        newClasses = currentUserClasses.filter(c => c !== classname);
      }
      return {
        ...prev,
        [userId]: {
          ...prev[userId],
          assignedClasses: newClasses,
        }
      };
    });
  };

  const handleSaveChanges = async (userId: string) => {
    const userChanges = editingUsers[userId];
    if (!userChanges) return;

    setIsSubmitting(true);
    try {
      await updateUser(userId, userChanges);
      toast({ title: "成功", description: `使用者資料已更新。` });
      setEditingUsers(prev => {
          const newEditing = {...prev};
          delete newEditing[userId];
          return newEditing;
      })
      await refetchData(); // Refresh to show persisted data
    } catch (error: any) {
      toast({ title: "更新失敗", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName?: string) => {
      setIsSubmitting(true);
      try {
          await deleteUser(userId);
          toast({ title: "成功", description: `使用者 ${userName || userId} 已被刪除。`});
          await refetchData();
      } catch (error: any) {
          toast({ title: "刪除失敗", description: error.message, variant: "destructive" });
      } finally {
          setIsSubmitting(false);
      }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlusCircle />
            新增使用者
          </CardTitle>
          <CardDescription>在此處建立新的使用者帳號並設定其權限。</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddNewUser} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
             <div className="space-y-1">
                <Label htmlFor="new-name">姓名</Label>
                <Input id="new-name" value={newUserName} onChange={e => setNewUserName(e.target.value)} placeholder="例如：王大明" />
            </div>
             <div className="space-y-1">
                <Label htmlFor="new-email">Email (登入帳號)</Label>
                <Input id="new-email" type="email" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} placeholder="user@example.com" />
            </div>
            <div className="space-y-1">
                <Label htmlFor="new-code">密碼 (代碼)</Label>
                <Input id="new-code" type="password" value={newUserCode} onChange={e => setNewUserCode(e.target.value)} placeholder="設定密碼" />
            </div>
             <div className="space-y-1">
                <Label htmlFor="new-role">權限角色</Label>
                <Select value={newUserRole || ''} onValueChange={(v) => setNewUserRole(v as UserRole)}>
                    <SelectTrigger id="new-role"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value!}>{opt.label}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
             <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="animate-spin" /> : <PlusCircle />}
                確認新增
            </Button>
            {newUserRole === 'teacher' && (
                 <div className="lg:col-span-5 space-y-2">
                    <Label>選擇此導師負責的班級</Label>
                     <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 p-4 border rounded-md">
                        {allAvailableClasses.map(c => (
                            <div key={c} className="flex items-center gap-2">
                                <Checkbox 
                                    id={`new-class-${c}`}
                                    checked={newUserClasses.includes(c)}
                                    onCheckedChange={(checked) => {
                                        if(checked) {
                                            setNewUserClasses(prev => [...prev, c]);
                                        } else {
                                            setNewUserClasses(prev => prev.filter(item => item !== c));
                                        }
                                    }}
                                />
                                <Label htmlFor={`new-class-${c}`}>{c}</Label>
                            </div>
                        ))}
                    </div>
                </div>
            )}
          </form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users />
            現有使用者列表
          </CardTitle>
          <CardDescription>管理系統中所有使用者的權限與資料。</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>姓名</TableHead>
                  <TableHead>Email (登入帳號)</TableHead>
                  <TableHead className="w-[200px]">密碼 (代碼)</TableHead>
                  <TableHead className="w-[150px]">權限角色</TableHead>
                  <TableHead className="w-[200px]">負責班級</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dataLoading ? (
                    <TableRow><TableCell colSpan={6} className="text-center h-24"><Loader2 className="animate-spin" /></TableCell></TableRow>
                ) : users.map(user => (
                  <TableRow key={user.id}>
                    <TableCell>
                        <Input value={editingUsers[user.id]?.name ?? user.name ?? ''} onChange={(e) => handleInlineChange(user.id, 'name', e.target.value)} className="h-8"/>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                     <TableCell>
                        <div className="relative">
                            <Input 
                                type={showPasswords[user.id] ? 'text' : 'password'}
                                placeholder="設定新密碼"
                                value={editingUsers[user.id]?.code ?? ''}
                                onChange={(e) => handleInlineChange(user.id, 'code', e.target.value)}
                                className="h-8 pr-8"
                            />
                            <Button type="button" variant="ghost" size="icon" className="absolute top-1/2 right-0 -translate-y-1/2 h-7 w-7" onClick={() => setShowPasswords(p => ({...p, [user.id]: !p[user.id]}))}>
                               {showPasswords[user.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                        </div>
                    </TableCell>
                    <TableCell>
                        <Select value={editingUsers[user.id]?.role ?? user.role ?? ''} onValueChange={(v) => handleInlineChange(user.id, 'role', v as UserRole)}>
                            <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                            <SelectContent>
                               {ROLE_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value!}>{opt.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </TableCell>
                    <TableCell>
                      {(editingUsers[user.id]?.role ?? user.role) === 'teacher' ? (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="h-8 w-full justify-start font-normal">
                                    <span className="truncate">{Array.isArray(editingUsers[user.id]?.assignedClasses ?? user.assignedClasses) ? (editingUsers[user.id]?.assignedClasses ?? user.assignedClasses)?.join(', ') : '選擇班級'}</span>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64 p-0">
                                <div className="p-4 space-y-2 max-h-60 overflow-y-auto">
                                   {allAvailableClasses.map(c => (
                                        <div key={c} className="flex items-center gap-2">
                                            <Checkbox 
                                                id={`class-${user.id}-${c}`}
                                                checked={(editingUsers[user.id]?.assignedClasses ?? user.assignedClasses ?? []).includes(c)}
                                                onCheckedChange={(checked) => handleMultiClassChange(user.id, c, !!checked)}
                                            />
                                            <Label htmlFor={`class-${user.id}-${c}`}>{c}</Label>
                                        </div>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>
                      ) : (
                        <Badge variant="outline">不適用</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                       <Button onClick={() => handleSaveChanges(user.id)} size="sm" disabled={!editingUsers[user.id] || isSubmitting}>
                            <Save className="mr-2 h-4 w-4"/>
                            儲存
                       </Button>
                       <AlertDialog>
                          <AlertDialogTrigger asChild>
                             <Button variant="destructive" size="sm" className="ml-2" disabled={isSubmitting}>
                                <Trash2 className="mr-2 h-4 w-4"/>
                                刪除
                             </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>確定刪除?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    您確定要永久從權限列表中移除使用者 {user.name} ({user.email}) 嗎? 此操作無法復原。
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                             <AlertDialogFooter>
                                <AlertDialogCancel>取消</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteUser(user.id, user.name)} className="bg-destructive hover:bg-destructive/90">
                                    確認刪除
                                </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                       </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
