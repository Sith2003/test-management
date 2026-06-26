'use client';

import { useState } from 'react';
import {
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  PlusIcon,
  KeyIcon,
} from '@heroicons/react/24/outline';
import { PageHeader } from '@/shared/components/PageHeader';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Select } from '@/shared/components/ui/Select';
import { Spinner } from '@/shared/components/ui/Spinner';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { Pagination } from '@/shared/components/ui/Pagination';
import { useUsers, useUpdateUser, useDeleteUser } from '../hooks/useUsers';
import { EditUserModal } from './EditUserModal';
import { CreateUserModal } from './CreateUserModal';
import { ChangePasswordModal } from './ChangePasswordModal';
import { useAuthStore } from '@/shared/stores/authStore';
import { UserRole } from '@/shared/types';
import type { User } from '@/shared/types';
import { formatDate } from '@/shared/utils/date';
import { TH, TD } from '@/shared/constants/table';

const ROLE_FILTER_OPTIONS = [
  { value: '', label: 'All Roles' },
  { value: UserRole.ADMIN, label: 'Admin' },
  { value: UserRole.MANAGER, label: 'Manager' },
  { value: UserRole.QA, label: 'QA' },
  { value: UserRole.VIEWER, label: 'Viewer' },
];

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
];

export function UserList() {
  const { user: currentUser } = useAuthStore();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [changePasswordTarget, setChangePasswordTarget] = useState<User | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data, isLoading, isError } = useUsers(page, search, roleFilter, statusFilter);
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const users: User[] = data?.data ?? [];
  const pagination = data?.pagination;

  const handleToggleActive = (user: User) => {
    const newActive = !(user.isActive ?? true);
    updateUser.mutate({ userId: user.id, input: { isActive: newActive } });
  };

  const handleDelete = (user: User) => {
    if (window.confirm(`Delete user "${user.name}"? This action cannot be undone.`)) {
      deleteUser.mutate(user.id);
    }
  };

  return (
    <div>
      <PageHeader
        title="User Management"
        description="Manage user accounts and their roles"
        actions={
          <Button variant="primary" size="sm" onClick={() => setIsCreateOpen(true)}>
            <PlusIcon className="h-4 w-4 mr-1.5" />
            Add New User
          </Button>
        }
      />

      <div className="px-8 py-6">
        {/* Filters bar */}
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search users..."
              className="pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 w-56 transition-shadow"
            />
          </div>

          {/* Role filter */}
          <div className="w-36">
            <Select
              value={roleFilter}
              options={ROLE_FILTER_OPTIONS}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            />
          </div>

          {/* Status filter */}
          <div className="w-36">
            <Select
              value={statusFilter}
              options={STATUS_FILTER_OPTIONS}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            />
          </div>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex justify-center py-16">
            <Spinner size="lg" className="text-primary-500" />
          </div>
        )}

        {/* Error state */}
        {isError && (
          <div className="bg-white rounded-xl ring-1 ring-gray-900/[0.06] p-6 text-center text-sm text-red-600">
            Failed to load users. Please try again.
          </div>
        )}

        {/* Table */}
        {!isLoading && !isError && (
          <>
            <div className="bg-white rounded-xl ring-1 ring-gray-900/[0.06] overflow-hidden">
              {users.length === 0 ? (
                <EmptyState
                  title="No users found"
                  description="Try adjusting your search or filter criteria."
                />
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50/80 border-b border-gray-100">
                    <tr>
                      <th className={TH}>Name</th>
                      <th className={TH}>Email</th>
                      <th className={TH}>Role</th>
                      <th className={TH}>Status</th>
                      <th className={TH}>Joined</th>
                      <th className={`${TH} text-right`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.map((user) => {
                      const isSelf = user.id === currentUser?.id;
                      const isActive = user.isActive ?? true;
                      return (
                        <tr key={user.id} className="hover:bg-gray-50/60 transition-colors group">
                          {/* Name */}
                          <td className={TD}>
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded-full bg-primary-100 flex items-center justify-center text-xs font-bold text-primary-600 shrink-0">
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-medium text-gray-900">
                                {user.name}
                                {isSelf && (
                                  <span className="ml-1.5 text-xs text-primary-500 font-normal">(You)</span>
                                )}
                              </span>
                            </div>
                          </td>

                          {/* Email */}
                          <td className={TD}>
                            <span className="text-gray-500">{user.email}</span>
                          </td>

                          {/* Role */}
                          <td className={TD}>
                            <Badge variant="default">{user.role}</Badge>
                          </td>

                          {/* Status */}
                          <td className={TD}>
                            <span
                              className={[
                                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                                isActive
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-600',
                              ].join(' ')}
                            >
                              {isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>

                          {/* Joined */}
                          <td className={TD}>
                            <span className="text-gray-400 text-xs">{formatDate(user.createdAt)}</span>
                          </td>

                          {/* Actions */}
                          <td className={`${TD} text-right`}>
                            {isSelf ? (
                              <span className="text-xs text-gray-400 italic">—</span>
                            ) : (
                              <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {/* Edit role */}
                                <button
                                  onClick={() => setEditTarget(user)}
                                  className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                                  aria-label={`Edit ${user.name}`}
                                >
                                  <PencilSquareIcon className="h-4 w-4" />
                                </button>

                                {/* Change password */}
                                <button
                                  onClick={() => setChangePasswordTarget(user)}
                                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                  aria-label={`Change password for ${user.name}`}
                                >
                                  <KeyIcon className="h-4 w-4" />
                                </button>

                                {/* Activate / Deactivate */}
                                <button
                                  onClick={() => handleToggleActive(user)}
                                  disabled={updateUser.isPending}
                                  className={[
                                    'px-2 py-1 text-xs rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
                                    isActive
                                      ? 'text-orange-600 hover:bg-orange-50'
                                      : 'text-green-600 hover:bg-green-50',
                                  ].join(' ')}
                                  aria-label={isActive ? `Deactivate ${user.name}` : `Activate ${user.name}`}
                                >
                                  {isActive ? 'Deactivate' : 'Activate'}
                                </button>

                                {/* Delete */}
                                <button
                                  onClick={() => handleDelete(user)}
                                  disabled={deleteUser.isPending}
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  aria-label={`Delete ${user.name}`}
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-4">
                <Pagination
                  pagination={pagination}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit modal */}
      {editTarget && (
        <EditUserModal
          user={editTarget}
          isOpen={!!editTarget}
          onClose={() => setEditTarget(null)}
        />
      )}

      {/* Create user modal */}
      <CreateUserModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />

      {/* Change password modal */}
      {changePasswordTarget && (
        <ChangePasswordModal
          user={changePasswordTarget}
          isOpen={!!changePasswordTarget}
          onClose={() => setChangePasswordTarget(null)}
        />
      )}
    </div>
  );
}
