'use client'

import SemesterSettingsCard from '@/components/settings/semester-settings-card'
import DataImportClient from '@/components/settings/data-import-client'
import PhotoImportCard from '@/components/settings/photo-import-card'
import DatabaseSettings from '@/components/settings/database-settings'
import DeleteStudents from '@/components/settings/delete-students'

export default function SystemSettingsPage() {
  return (
    <div className="p-6 space-y-10">
      <h1 className="text-3xl font-bold mb-4">環境設定</h1>

      {/* 📅 學期設定區塊 */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">📅 學期設定</h2>
        <SemesterSettingsCard />
      </section>

      {/* 📥 資料匯入區塊 */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">📥 資料匯入</h2>
        <DataImportClient />
        <PhotoImportCard />
      </section>

      {/* 🛠 系統維護區塊 */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">🛠 系統維護</h2>
        <DatabaseSettings />
        <DeleteStudents />
      </section>
    </div>
  )
}