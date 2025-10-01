'use client'

import BatchStatusUpdate from '@/components/settings/batch-status-update'

export default function BatchStatusPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">批次學籍管理</h1>
      <BatchStatusUpdate />
    </div>
  )
}