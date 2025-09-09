import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Lightbulb } from 'lucide-react';

interface InterventionSuggestionsProps {
  suggestions: string | null;
  isLoading: boolean;
}

export default function InterventionSuggestions({ suggestions, isLoading }: InterventionSuggestionsProps) {
  return (
    <Card className="min-h-[200px]">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Lightbulb className="mr-2 h-5 w-5 text-yellow-500" />
          建議的介入措施
        </CardTitle>
        <CardDescription>AI 提供的學生支援建議。</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[80%]" />
            <Skeleton className="h-4 w-[90%]" />
          </div>
        ) : suggestions ? (
          <div className="space-y-2 text-sm text-foreground whitespace-pre-wrap font-sans">
            {suggestions}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-center text-muted-foreground">
            <p>點擊「獲取 AI 建議」以產生建議。</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
