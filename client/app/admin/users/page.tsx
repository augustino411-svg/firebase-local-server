'use client'

import AdminUsersClient from '@/components/admin/admin-users-client'

export default function UserManagementPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">使用者權限管理</h1>
      <AdminUsersClient />
    </div>
  )
}