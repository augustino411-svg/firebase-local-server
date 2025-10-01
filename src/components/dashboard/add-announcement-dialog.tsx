
'use client';

import React, { useState } from 'react';
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
import { Loader2, Upload, Paperclip, X } from 'lucide-react';
import { addAnnouncement } from '@/lib/data-client';
import { Badge } from '../ui/badge';
import { useAuth } from '@/context/auth-context';

interface AddAnnouncementDialogProps {
  onAnnouncementAdded: () => void;
}

export default function AddAnnouncementDialog({ onAnnouncementAdded }: AddAnnouncementDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { permission } = useAuth();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };
  
  const resetForm = () => {
    setTitle('');
    setContent('');
    setFile(null);
  }

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
        description: '您必須登入且擁有權限才能發布公告。',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await addAnnouncement(title, content, permission, file || undefined);
      toast({
        title: '成功',
        description: '新公告已成功發布。',
      });
      onAnnouncementAdded(); // Callback to refresh the list
      setIsOpen(false); // Close the dialog
      resetForm(); // Reset form
    } catch (error: any) {
      toast({
        title: '發布失敗',
        description: error.message || '無法儲存公告，請稍後再試。',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if(!open) resetForm();
      setIsOpen(open);
    }}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          上傳新公告
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>新增公告</DialogTitle>
          <DialogDescription>
            請在此處輸入公告的標題與內容，發布後將會顯示在首頁。
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
               <Label htmlFor="file-upload" className="text-right pt-2">
                附件
              </Label>
              <div className="col-span-3 space-y-2">
                <Input
                    id="file-upload"
                    type="file"
                    onChange={handleFileChange}
                    disabled={true} 
                  />
                  <p className="text-xs text-muted-foreground">功能建置中</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? '發布中...' : '確認發布'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
