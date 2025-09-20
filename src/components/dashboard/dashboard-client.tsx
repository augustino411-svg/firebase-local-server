
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Trash2, MoreVertical, Pencil, BookUser, CalendarClock, BarChart, Settings, Megaphone, Paperclip, Grid, HeartHandshake, Users as UsersIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getAnnouncements, deleteAnnouncement } from '@/lib/data-client';
import type { Announcement } from '@/types';
import AddAnnouncementDialog from './add-announcement-dialog';
import EditAnnouncementDialog from './edit-announcement-dialog';
import { Button } from '../ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { useAuth } from '@/context/auth-context';
import { getRoleLabel } from '@/lib/utils';


export default function DashboardClient() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const { permission } = useAuth();
  const canPostAnnouncement = permission?.role === 'admin';

  const { toast } = useToast();

  const fetchAnnouncements = async () => {
    setIsLoading(true);
    try {
      const fetchedAnnouncements = await getAnnouncements();
      // Ensure sorting is always correct on the client-side
      const sortedAnnouncements = fetchedAnnouncements.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });
      setAnnouncements(sortedAnnouncements);
    } catch (error) {
      toast({
          title: '錯誤',
          description: '無法載入公告資料。',
          variant: 'destructive'
      });
      console.error("Failed to fetch announcements", error);
    } finally {
      setIsLoading(false);
    }
  }
  
  const handleDelete = async (id: string) => {
    setIsDeleting(id);
    try {
        await deleteAnnouncement(id);
        toast({ title: '成功', description: '公告已刪除。' });
        fetchAnnouncements();
    } catch(error) {
         toast({ title: '刪除失敗', description: '無法刪除公告，請稍後再試。', variant: 'destructive' });
    } finally {
        setIsDeleting(null);
    }
  }


  useEffect(() => {
    fetchAnnouncements();
  }, []);
  
  const canViewAdminPages = permission?.role === 'admin';
  const canViewCounselingStats = permission?.role === 'admin' || permission?.role === 'teacher';
  const canViewAttendanceStats = permission?.role === 'admin' || permission?.role === 'teacher' || permission?.role === 'part-time';
  const canViewSeatingChart = permission?.role === 'admin' || permission?.role === 'teacher' || permission?.role === 'part-time';

  return (
    <div className="space-y-6">

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle className="flex items-center gap-2">
                    <Megaphone />
                    公告欄
                </CardTitle>
                <CardDescription>最新的公告與重要訊息</CardDescription>
            </div>
            {canPostAnnouncement && <AddAnnouncementDialog onAnnouncementAdded={fetchAnnouncements} />}
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="flex items-center justify-center h-24">
                <Loader2 className="h-6 w-6 animate-spin" />
             </div>
          ) : announcements.length > 0 ? (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-3">
              {announcements.map(announcement => (
                <div key={announcement.id} className="relative p-4 border rounded-lg bg-muted/50">
                   <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{announcement.title}</h4>
                      <p className="text-muted-foreground text-sm mt-1 mb-2">{announcement.date}</p>
                    </div>
                     <p className="text-xs text-muted-foreground pt-1">
                        {`${announcement.authorName || announcement.authorEmail} (${getRoleLabel(announcement.authorRole) || '未知'})`}
                      </p>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{announcement.content}</p>

                  {announcement.fileUrl && announcement.fileName && (
                    <div className="mt-4">
                      <a 
                        href={announcement.fileUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
                      >
                        <Paperclip className="h-4 w-4" />
                        <span>{announcement.fileName}</span>
                      </a>
                    </div>
                  )}
                  
                  {canPostAnnouncement && <div className="absolute top-2 right-2">
                      <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                              </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                             <EditAnnouncementDialog 
                                  announcement={announcement} 
                                  onAnnouncementUpdated={fetchAnnouncements}
                             >
                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                      <Pencil className="mr-2 h-4 w-4" />
                                      <span>修改</span>
                                  </DropdownMenuItem>
                              </EditAnnouncementDialog>
                              <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                       <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          <span>刪除</span>
                                      </DropdownMenuItem>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                      <AlertDialogHeader>
                                          <AlertDialogTitle>確定要刪除這則公告嗎?</AlertDialogTitle>
                                          <AlertDialogDescription>
                                              這個操作無法復原。這將會永久從我們的伺服器刪除這則公告與其附件。
                                          </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                          <AlertDialogCancel>取消</AlertDialogCancel>
                                          <AlertDialogAction 
                                              onClick={() => handleDelete(announcement.id)} 
                                              disabled={!!isDeleting}
                                              className="bg-destructive hover:bg-destructive/90"
                                          >
                                              {isDeleting === announcement.id ? '刪除中...' : '確認刪除'}
                                          </AlertDialogAction>
                                      </AlertDialogFooter>
                                  </AlertDialogContent>
                              </AlertDialog>
                          </DropdownMenuContent>
                      </DropdownMenu>
                  </div>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground p-4">目前沒有任何公告。</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle>快速連結</CardTitle>
            <CardDescription>前往您需要的功能頁面。</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
             <QuickLink
                href="/students"
                icon={<BookUser className="h-8 w-8" />}
                title="學生資訊"
                description="查詢所有學生資料"
            />
            {canViewCounselingStats && <QuickLink
                href="/counseling-statistics"
                icon={<HeartHandshake className="h-8 w-8" />}
                title="學生輔導統計表"
                description="查看輔導統計分析與紀錄"
            />}
            <QuickLink
                href="/roll-call"
                icon={<CalendarClock className="h-8 w-8" />}
                title="點名系統"
                description="進行每日班級點名與出缺勤登錄"
            />
            {canViewAttendanceStats && <QuickLink
                href="/attendance-statistics"
                icon={<BarChart className="h-8 w-8" />}
                title="缺曠統計表"
                description="查看全校或各班級的缺曠統計分析"
            />}
            {canViewAdminPages && <QuickLink
                href="/admin/users"
                icon={<UsersIcon className="h-8 w-8" />}
                title="使用者權限管理"
                description="新增、刪除、修改使用者權限"
            />}
            {canViewAdminPages && <QuickLink
                href="/admin/settings"
                icon={<Settings className="h-8 w-8" />}
                title="環境設定"
                description="設定學期、假日、與資料庫管理"
            />}
        </CardContent>
      </Card>

    </div>
  );
}

interface QuickLinkProps {
    href: string;
    icon: React.ReactNode;
    title: string;
    description: string;
}

function QuickLink({ href, icon, title, description }: QuickLinkProps) {
    return (
        <Link href={href} className="block group">
            <Card className="h-full transition-colors duration-200 group-hover:border-primary group-hover:bg-primary/5">
                <CardHeader className="flex flex-row items-center gap-4">
                    <div className="bg-primary/10 p-3 rounded-lg text-primary">
                        {icon}
                    </div>
                    <div>
                        <CardTitle className="text-lg">{title}</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">{description}</p>
                </CardContent>
            </Card>
        </Link>
    );
}
