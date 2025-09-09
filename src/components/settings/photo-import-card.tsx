
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { UploadCloud, Loader2, AlertTriangle, Image as ImageIcon } from 'lucide-react';
import { useData } from '@/context/data-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';

export default function PhotoImportCard() {
    const { toast } = useToast();
    const { classes } = useData();
    const [selectedClass, setSelectedClass] = useState<string>('all');

    const handleFeatureDisabled = () => {
        toast({
            title: "功能暫停",
            description: "此功能正在進行後端架構升級，暫時無法使用。",
            variant: "destructive"
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ImageIcon />
                    批次學生照片匯入
                </CardTitle>
                <CardDescription>
                   一次上傳多張學生照片。請確保每張照片的**檔名**就是該學生的**學號** (例如：113001.jpg)。
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                 <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>功能升級中</AlertTitle>
                    <AlertDescription>
                        為提升系統穩定性，照片批次匯入功能正在進行後端架構升級，暫時無法使用。
                    </AlertDescription>
                </Alert>

                <div className="flex flex-col sm:flex-row gap-4 opacity-50 cursor-not-allowed">
                    <div className="flex-1 border-2 border-dashed border-muted-foreground/50 rounded-lg p-6 text-center">
                        <div className="mx-auto w-fit bg-muted p-4 rounded-full mb-4">
                            <UploadCloud className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-medium">請選擇您的照片檔案</h3>
                        <p className="text-sm text-muted-foreground mb-4">將檔案拖曳至此，或點擊按鈕選擇多個檔案。</p>
                        <Button asChild disabled>
                            <Label htmlFor="photo-upload-file">
                                <UploadCloud className="mr-2 h-4 w-4"/>
                                選擇檔案
                                <Input 
                                    id="photo-upload-file" 
                                    type="file" 
                                    className="sr-only" 
                                    accept="image/png, image/jpeg, image/jpg" 
                                    multiple 
                                    disabled
                                />
                            </Label>
                        </Button>
                    </div>
                    <div className="w-full sm:w-[240px] space-y-4">
                        <div>
                            <Label>操作班級 (可選)</Label>
                            <Select value={selectedClass} onValueChange={setSelectedClass} disabled>
                                <SelectTrigger>
                                <SelectValue placeholder="選擇班級" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">所有班級</SelectItem>
                                    {classes.map((c) => (
                                        <SelectItem key={c} value={c}>
                                        {c}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground mt-1">選擇班級可讓您操作更有條理，但不會影響上傳效率。</p>
                        </div>
                        <Button onClick={handleFeatureDisabled} disabled className="w-full">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            開始上傳
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
