
'use client';

import React, { useState, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Paperclip, X } from 'lucide-react';
import { updateAnnouncement } from '@/lib/data-client';
import type { Announcement } from '@/types';
import Link from 'next/link';
import { Badge } from '../ui/badge';
import { useAuth } from '@/context/auth-context';

interface EditAnnouncementDialogProps {
  announcement: Announcement;
  onAnnouncementUpdated: () => void;
  children: React.ReactNode;
}

export default function EditAnnouncementDialog({
  announcement,
  onAnnouncementUpdated,
  children
}: EditAnnouncementDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState(announcement.title);
  const [content, setContent] = useState(announcement.content);
  const [file, setFile] = useState<File | null>(null);
  const [existingFile, setExistingFile] = useState<{name: string, url: string} | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { permission } = useAuth();

  useEffect(() => {
    if (isOpen) {
      setTitle(announcement.title);
      setContent(announcement.content);
      if(announcement.fileName && announcement.fileUrl) {
          setExistingFile({name: announcement.fileName, url: announcement.fileUrl});
      } else {
          setExistingFile(null);
      }
      setFile(null);
    }
  }, [isOpen, announcement]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
      setExistingFile(null); // Clear existing file if a new one is selected
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast({
        title: '錯誤',
        description: '標題和內容不能為空。',
        variant: 'destructive',
      });
      return;
    }
    
    if (!permission) {
       toast({
        title: '錯誤',
        description: '您必須登入才能修改公告。',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await updateAnnouncement(announcement.id, title, content, permission, file || undefined);
      toast({
        title: '成功',
        description: '公告已成功更新。',
      });
      onAnnouncementUpdated();
      setIsOpen(false);
    } catch (error: any) {
      toast({
        title: '更新失敗',
        description: error.message || '無法儲存公告，請稍後再試。',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>修改公告</DialogTitle>
          <DialogDescription>
            請在此處編輯公告的標題與內容。
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                標題
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="col-span-3"
                disabled={isSubmitting}
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="content" className="text-right pt-2">
                內容
              </Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="col-span-3"
                rows={5}
                disabled={isSubmitting}
              />
            </div>
             <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="file-edit-upload" className="text-right pt-2">
                附件
              </Label>
               <div className="col-span-3 space-y-2">
                  <Input
                    id="file-edit-upload"
                    type="file"
                    onChange={handleFileChange}
                    disabled={true}
                  />
                   <p className="text-xs text-muted-foreground">功能建置中</p>
                  {existingFile && (
                    <div className="text-sm mt-2 text-muted-foreground">
                        目前檔案: <a href={existingFile.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{existingFile.name}</a>
                    </div>
                  )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? '儲存中...' : '確認儲存'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
