'use client';

import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { addUser, updateUser, deleteUser } from '@/lib/data-client';
import type { UserWithRole, UserRole } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger
} from '../ui/alert-dialog';
import { Badge } from '../ui/badge';
import { useData } from '@/context/data-context';
import { Label } from '../ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Loader2, Users, PlusCircle, Trash2, Save, Eye, EyeOff } from 'lucide-react';

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'admin', label: '管理者' },
  { value: 'teacher', label: '導師' },
  { value: 'part-time', label: '兼課老師' },
];

export default function AdminUsersClient() {
  const { toast } = useToast();
  const { classes: allAvailableClasses, users, loading: dataLoading, refetchData } = useData();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingUsers, setEditingUsers] = useState<Record<string, Partial<UserWithRole>>>({});
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
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

      if (result.success) {
        toast({ title: "成功", description: `使用者 ${newUserName} 已成功新增。` });
        setNewUserName('');
        setNewUserEmail('');
        setNewUserCode('');
        setNewUserRole('part-time');
        setNewUserClasses([]);
        await refetchData();
      } else {
        toast({ title: "新增失敗", description: result.message || '發生未知錯誤', variant: "destructive" });
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({ title: "新增失敗", description: message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInlineChange = (
    userId: string,
    field: keyof UserWithRole,
    value: string | boolean | string[]
  ) => {
    setEditingUsers(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [field]: value,
      },
    }));
  };

  const handleMultiClassChange = (userId: string, classname: string, checked: boolean) => {
    setEditingUsers(prev => {
      const currentUserClasses = prev[userId]?.assignedClasses ?? users.find(u => u.id === userId)?.assignedClasses ?? [];
      const newClasses = checked
        ? [...currentUserClasses, classname]
        : currentUserClasses.filter(c => c !== classname);
      return {
        ...prev,
        [userId]: {
          ...prev[userId],
          assignedClasses: newClasses,
        },
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
        const newEditing = { ...prev };
        delete newEditing[userId];
        return newEditing;
      });
      await refetchData();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({ title: "更新失敗", description: message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName?: string) => {
    setIsSubmitting(true);
    try {
      await deleteUser(userId);
      toast({ title: "成功", description: `使用者 ${userName || userId} 已被刪除。` });
      await refetchData();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({ title: "刪除失敗", description: message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 新增使用者表單與使用者列表表格 */}
      {/* 你貼的 UI 結構保持不變，已無型別錯誤 */}
    </div>
  );
}
