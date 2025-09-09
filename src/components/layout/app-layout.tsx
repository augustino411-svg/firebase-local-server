
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookUser, Home, Settings, PanelLeft, School, CalendarClock, LogOut, Loader2, BarChart, ShieldAlert, HeartHandshake, Database, Grid, Users as UsersIcon, Shuffle } from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  SidebarFooter,
  useSidebar,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/context/auth-context';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const { permission, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

  if (!permission) {
    // AuthProvider will handle redirect, return null or a minimal loader
    return (
       <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <AppSidebar />
        <div className="flex-1">
          <AppHeader />
          <SidebarInset>
            <main className="p-4 lg:p-6">{children}</main>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}

function AppSidebar() {
  const pathname = usePathname();
  const { open } = useSidebar();
  const { permission, manualSignOut } = useAuth();

  const handleLogout = () => {
    manualSignOut();
  }

  const canViewAdminPages = permission?.role === 'admin';
  const canViewCounselingStats = permission?.role === 'admin' || permission?.role === 'teacher';
  const canViewAttendanceStats = permission?.role === 'admin' || permission?.role === 'teacher' || permission?.role === 'part-time';
  
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarHeader className="p-4">
          <Link href="/" className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="shrink-0 rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
              <School className="size-5" />
            </Button>
            <div className={`transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0'}`}>
              <h1 className="text-lg font-semibold text-primary">啟英高中進修部小系統</h1>
            </div>
          </Link>
        </SidebarHeader>

        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === '/'}
              tooltip="首頁"
            >
              <Link href="/">
                <Home />
                <span>首頁</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith('/students')}
              tooltip="學生資訊"
            >
              <Link href="/students">
                <BookUser />
                <span>學生資訊</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
           {canViewCounselingStats && <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === '/counseling-statistics'}
              tooltip="學生輔導統計表"
            >
              <Link href="/counseling-statistics">
                <HeartHandshake />
                <span>學生輔導統計表</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>}
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === '/roll-call'}
              tooltip="點名系統"
            >
              <Link href="/roll-call">
                <CalendarClock />
                <span>點名系統</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {canViewAttendanceStats && <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === '/attendance-statistics'}
              tooltip="缺曠統計表"
            >
              <Link href="/attendance-statistics">
                <BarChart />
                <span>缺曠統計表</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>}
           {canViewAdminPages && (
              <Collapsible asChild>
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      isActive={pathname.startsWith('/admin')}
                      tooltip="系統管理"
                    >
                      <Settings />
                      <span>系統管理</span>
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent asChild>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={pathname === '/admin/users'}>
                           <Link href="/admin/users">
                            <UsersIcon className="mr-2 h-4 w-4" />
                            <span>使用者權限管理</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={pathname === '/admin/batch-status'}>
                           <Link href="/admin/batch-status">
                            <Shuffle className="mr-2 h-4 w-4" />
                            <span>批次學籍管理</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={pathname === '/admin/settings'}>
                          <Link href="/admin/settings">
                             <Database className="mr-2 h-4 w-4" />
                            <span>環境設定</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
          )}
        </SidebarMenu>
      </SidebarContent>
       <SidebarFooter>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
               <div className={`flex w-full cursor-pointer items-center gap-2 rounded-md p-2 hover:bg-sidebar-accent ${open ? '' : 'justify-center'}`}>
                  <Avatar className="size-8">
                    <AvatarImage src={'https://placehold.co/100x100.png'} alt={permission?.name || 'User'} />
                    <AvatarFallback>{permission?.name?.charAt(0) || permission?.email?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className={`transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0'}`}>
                    <p className="text-sm font-medium text-sidebar-foreground">{permission?.name || permission?.email}</p>
                    <p className="text-xs text-muted-foreground">{permission?.email}</p>
                  </div>
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 mb-2" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{permission?.name || permission?.email}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {permission?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>登出</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
        </SidebarFooter>
    </Sidebar>
  );
}

function AppHeader() {
  const { isMobile } = useSidebar();
  const { permission, manualSignOut } = useAuth();

   const handleLogout = () => {
    manualSignOut();
  }

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6">
      {isMobile && <SidebarTrigger>
        <PanelLeft />
      </SidebarTrigger>}
      <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <div className="ml-auto flex-1 sm:flex-initial" />
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={'https://placehold.co/100x100.png'} alt={permission?.name || 'User'} />
                        <AvatarFallback>{permission?.name?.charAt(0) || permission?.email?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>{permission?.name || permission?.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>登出</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
