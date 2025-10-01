import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { BadgeProps } from "@/components/ui/badge";
import { UserRole } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getStatusText = (statusCode?: string) => {
    switch (statusCode) {
        case '1': return '一般';
        case '2': return '休學';
        case '3': return '退學';
        case '4': return '畢業';
        default: return '未知';
    }
}

export const getStatusVariant = (statusCode?: string): BadgeProps['variant'] => {
    switch (statusCode) {
        case '1': return 'secondary';
        case '2': return 'outline';
        case '3': return 'destructive';
        case '4': return 'default';
        default: return 'secondary';
    }
}

export const getRoleLabel = (role: UserRole | undefined | null): string => {
  switch (role) {
    case 'admin': return '管理者';
    case 'teacher': return '導師';
    case 'part-time': return '兼課老師';
    default: return '未知';
  }
}
