
'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, Loader2, X } from 'lucide-react';
import type { Student } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Image from 'next/image';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '../ui/badge';
import { getStatusText, getStatusVariant } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { useData } from '@/context/data-context';

const STATUS_OPTIONS = [
    { value: 'all', label: '所有狀態' },
    { value: '1', label: '一般' },
    { value: '2', label: '休學' },
    { value: '3', label: '退學' },
    { value: '4', label: '畢業' },
];

export default function StudentDashboard() {
  const { permission, loading: authLoading } = useAuth();
  const { students: allStudents, classes, loading: dataLoading } = useData();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  
  const isLoading = authLoading || dataLoading;

  const handleClearSelection = () => {
    setSelectedClass('all');
    setSearchTerm('');
    setSelectedStatus('all');
  };

  const filteredStudents = useMemo(() => {
    let students = allStudents;

    // Teacher role can only see their assigned classes
    if (permission?.role === 'teacher' && permission.assignedClasses) {
        students = students.filter(student => {
            const studentClass = student.currentClass || student.className;
            return studentClass && permission.assignedClasses!.includes(studentClass);
        });
    }

    if (selectedClass && selectedClass !== 'all') {
      students = students.filter(student => {
        return (student.currentClass || student.className) === selectedClass;
      });
    }

    if (selectedStatus !== 'all') {
      students = students.filter(student => student.statusCode === selectedStatus);
    }
    
    if (searchTerm) {
       students = students.filter(
        (student) =>
          student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (student.nationalId && student.nationalId.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    return students.sort((a,b) => (a.seatNumber || '').localeCompare(b.seatNumber || ''));

  }, [allStudents, selectedClass, searchTerm, selectedStatus, permission]);
  
  const displayClasses = useMemo(() => {
    if(permission?.role === 'teacher') {
        return permission.assignedClasses || [];
    }
    return classes;
  }, [classes, permission]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>學生資料庫</CardTitle>
          <CardDescription>請使用班級、學籍或姓名等條件進行篩選與查詢。</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="篩選班級" />
                </SelectTrigger>
                <SelectContent>
                   <SelectItem value="all">所有班級</SelectItem>
                  {displayClasses.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedClass && selectedClass !== 'all' && (
                <Button variant="ghost" size="icon" onClick={handleClearSelection}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
             <div className="w-full sm:w-[150px]">
                 <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger>
                        <SelectValue placeholder="篩選學籍狀態" />
                    </SelectTrigger>
                    <SelectContent>
                        {STATUS_OPTIONS.map(opt => (
                             <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                    </SelectContent>
                 </Select>
            </div>
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="依姓名、學號或身分證號搜尋..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">頭像</TableHead>
                  <TableHead>學生姓名</TableHead>
                  <TableHead>學號</TableHead>
                  <TableHead>班級</TableHead>
                  <TableHead>座號</TableHead>
                  <TableHead>學籍狀態</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <div className="flex justify-center items-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        <span>讀取中...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <TableRow key={student.studentId}>
                      <TableCell>
                        <Image
                          src={student.profilePictureUrl || 'https://placehold.co/100x100.png'}
                          alt={student.name}
                          width={40}
                          height={40}
                          className="rounded-full"
                          data-ai-hint="person portrait"
                        />
                      </TableCell>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>{student.studentId}</TableCell>
                      <TableCell>{student.currentClass || student.className}</TableCell>
                      <TableCell>{student.seatNumber || 'N/A'}</TableCell>
                      <TableCell>
                          <Badge variant={getStatusVariant(student.statusCode)}>
                            {getStatusText(student.statusCode)}
                          </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/students/${student.studentId}`}>{`查看詳細資料`}</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      找不到符合條件的學生。
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
