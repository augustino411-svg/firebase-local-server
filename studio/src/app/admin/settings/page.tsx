'use client';

import { Separator } from '@/components/ui/separator';
import DataImportClient from '@/components/settings/data-import-client';
import DatabaseSettings from '@/components/settings/database-settings';
import DeleteStudents from '@/components/settings/delete-students';
import SemesterSettingsCard from '@/components/settings/semester-settings-card';
import PhotoImportCard from '@/components/settings/photo-import-card';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <SemesterSettingsCard />
      <Separator />
      <DataImportClient />
      <Separator />
      <PhotoImportCard />
      <Separator />
      <DatabaseSettings />
      <Separator />
      <DeleteStudents />
    </div>
  );
}
