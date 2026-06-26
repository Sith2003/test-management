'use client';

import { useState } from 'react';
import { TrashIcon, PlusIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { Button } from '@/shared/components/ui/Button';
import { Spinner } from '@/shared/components/ui/Spinner';
import { Badge } from '@/shared/components/ui/Badge';
import {
  useProjectMembers,
  useAddProjectMember,
  useUpdateProjectMember,
  useRemoveProjectMember,
} from '@/features/projects/hooks/useProjects';
import { useAuthStore } from '@/shared/stores/authStore';
import { ProjectMemberRole, UserRole } from '@/shared/types';

const ROLE_OPTIONS: { value: ProjectMemberRole; label: string }[] = [
  { value: ProjectMemberRole.ADMIN, label: 'Admin' },
  { value: ProjectMemberRole.MANAGER, label: 'Manager' },
  { value: ProjectMemberRole.QA, label: 'QA' },
  { value: ProjectMemberRole.VIEWER, label: 'Viewer' },
];

const ROLE_BADGE: Record<ProjectMemberRole, string> = {
  [ProjectMemberRole.ADMIN]: 'bg-rose-100 text-rose-700',
  [ProjectMemberRole.MANAGER]: 'bg-primary-100 text-primary-700',
  [ProjectMemberRole.QA]: 'bg-emerald-100 text-emerald-700',
  [ProjectMemberRole.VIEWER]: 'bg-gray-100 text-gray-600',
};

interface Props {
  projectId: string;
}

export function ProjectMembersSection({ projectId }: Props) {
  const { user } = useAuthStore();
  const { data: members, isLoading } = useProjectMembers(projectId);
  const addMember = useAddProjectMember(projectId);
  const updateMember = useUpdateProjectMember(projectId);
  const removeMember = useRemoveProjectMember(projectId);

  const [addEmail, setAddEmail] = useState('');
  const [addRole, setAddRole] = useState<ProjectMemberRole>(ProjectMemberRole.QA);
  const [showAddForm, setShowAddForm] = useState(false);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  const isAdmin = user?.role === UserRole.ADMIN;

  // Check if current user is project admin by inspecting their membership
  const currentMember = members?.find((m) => m.user?.id === user?.id || m.userId === user?.id);
  const canManage = isAdmin || currentMember?.role === ProjectMemberRole.ADMIN;

  const handleAdd = () => {
    if (!addEmail.trim()) return;
    addMember.mutate(
      { email: addEmail.trim().toLowerCase(), role: addRole },
      {
        onSuccess: () => {
          setAddEmail('');
          setAddRole(ProjectMemberRole.QA);
          setShowAddForm(false);
        },
      }
    );
  };

  const handleRoleChange = (userId: string, role: string) => {
    updateMember.mutate({ userId, role });
  };

  const handleRemove = (userId: string) => {
    removeMember.mutate(userId, {
      onSuccess: () => setConfirmRemoveId(null),
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <ShieldCheckIcon className="h-4 w-4 text-gray-400" />
            Project Members
            <span className="ml-1 text-xs font-normal text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
              {members?.length ?? 0}
            </span>
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Manage who has access and their roles in this project.
          </p>
        </div>
        {canManage && (
          <Button
            variant="secondary"
            onClick={() => setShowAddForm(!showAddForm)}
            className="text-xs"
          >
            <PlusIcon className="h-3.5 w-3.5 mr-1" />
            Add Member
          </Button>
        )}
      </div>

      {/* Add member form */}
      {showAddForm && (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 space-y-3">
          <p className="text-xs font-medium text-gray-700">Add new member</p>
          <div className="flex gap-2">
            <input
              type="email"
              value={addEmail}
              onChange={(e) => setAddEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="Email address"
              className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400"
              autoFocus
            />
            <select
              value={addRole}
              onChange={(e) => setAddRole(e.target.value as ProjectMemberRole)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400"
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleAdd}
              isLoading={addMember.isPending}
              disabled={!addEmail.trim()}
              className="text-xs"
            >
              Add Member
            </Button>
            <Button
              variant="secondary"
              onClick={() => { setShowAddForm(false); setAddEmail(''); }}
              className="text-xs"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Members table */}
      <div className="bg-white rounded-xl ring-1 ring-gray-900/[0.06] overflow-hidden">
        {members?.length === 0 ? (
          <div className="text-center py-8 text-sm text-gray-400">No members yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Member</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Global Role</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Project Role</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Joined</th>
                {canManage && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {members?.map((member) => {
                const isSelf = member.user?.id === user?.id || member.userId === user?.id;
                return (
                  <tr key={member.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-full bg-primary-100 flex items-center justify-center text-xs font-semibold text-primary-700 shrink-0">
                          {member.user?.name?.charAt(0).toUpperCase() ?? '?'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-xs leading-tight">
                            {member.user?.name ?? '—'}
                            {isSelf && (
                              <span className="ml-1.5 text-[10px] text-gray-400">(you)</span>
                            )}
                          </p>
                          <p className="text-[11px] text-gray-400">{member.user?.email ?? '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-500">{member.user?.role ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      {canManage && !isSelf ? (
                        <select
                          value={member.role}
                          onChange={(e) => handleRoleChange(member.userId, e.target.value)}
                          disabled={updateMember.isPending}
                          className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 disabled:opacity-50"
                        >
                          {ROLE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span
                          className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_BADGE[member.role] ?? 'bg-gray-100 text-gray-600'}`}
                        >
                          {member.role}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {new Date(member.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    {canManage && (
                      <td className="px-4 py-3 text-right">
                        {!isSelf && (
                          confirmRemoveId === member.userId ? (
                            <div className="flex items-center gap-1.5 justify-end">
                              <span className="text-xs text-gray-500">Remove?</span>
                              <button
                                onClick={() => handleRemove(member.userId)}
                                disabled={removeMember.isPending}
                                className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                              >
                                Yes
                              </button>
                              <button
                                onClick={() => setConfirmRemoveId(null)}
                                className="text-xs text-gray-400 hover:text-gray-600"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmRemoveId(member.userId)}
                              className="p-1.5 text-gray-300 hover:text-red-500 transition-colors rounded"
                              title="Remove member"
                            >
                              <TrashIcon className="h-3.5 w-3.5" />
                            </button>
                          )
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
