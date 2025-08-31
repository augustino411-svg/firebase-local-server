'use client';

import AdminUsersClient from '@/components/admin/admin-users-client';

export default function AdminUsersPage() {
  // The AdminLayout guard handles authentication and role checks.
  return (
    <div className="space-y-6">
      <AdminUsersClient />
    </div>
  );
}
