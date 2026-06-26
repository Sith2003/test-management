'use client';

import { useState } from 'react';
import { UserPlusIcon, XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { Modal } from '@/shared/components/ui/Modal';
import { Spinner } from '@/shared/components/ui/Spinner';
import { useProjectMembers, useAddProjectMember, useRemoveProjectMember } from '../hooks/useProjects';
import { userService } from '@/features/users/services/userService';
import { UserRole } from '@/shared/types';
import { useQuery } from '@tanstack/react-query';

interface Props {
  projectId: string;
  projectName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function AssignDeveloperModal({ projectId, projectName, isOpen, onClose }: Props) {
  const [search, setSearch] = useState('');

  const { data: members = [], isLoading: loadingMembers } = useProjectMembers(projectId);
  const { data: developersRes, isLoading: loadingDevs } = useQuery({
    queryKey: ['users', 'developers'],
    queryFn: () => userService.getUsers({ role: UserRole.DEVELOPER, limit: '100' }),
    enabled: isOpen,
  });

  const addMember = useAddProjectMember(projectId);
  const removeMember = useRemoveProjectMember(projectId);

  const allDevelopers = developersRes?.data ?? [];

  // Members whose global role is DEVELOPER
  const assignedDeveloperIds = new Set(
    members
      .filter((m) => (m.user as { role: string } | undefined)?.role === UserRole.DEVELOPER)
      .map((m) => m.userId)
  );

  const filteredDevelopers = allDevelopers.filter((dev) =>
    search === '' ||
    dev.name.toLowerCase().includes(search.toLowerCase()) ||
    dev.email.toLowerCase().includes(search.toLowerCase())
  );

  const assignedDevelopers = filteredDevelopers.filter((d) => assignedDeveloperIds.has(d.id));
  const availableDevelopers = filteredDevelopers.filter((d) => !assignedDeveloperIds.has(d.id));

  const isLoading = loadingMembers || loadingDevs;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Assign Developers"
      size="md"
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-500">
          Manage developer access for <span className="font-medium text-gray-800">{projectName}</span>.
          Developers can view and comment on the Defect Log only.
        </p>

        {/* Search */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search developers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner size="md" />
          </div>
        ) : (
          <div className="space-y-4 max-h-80 overflow-y-auto">

            {/* Assigned */}
            {assignedDevelopers.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
                  Assigned ({assignedDevelopers.length})
                </p>
                <ul className="space-y-1.5">
                  {assignedDevelopers.map((dev) => (
                    <li
                      key={dev.id}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary-50 border border-primary-100"
                    >
                      <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                        {dev.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{dev.name}</p>
                        <p className="text-xs text-gray-500 truncate">{dev.email}</p>
                      </div>
                      <button
                        onClick={() => removeMember.mutate(dev.id)}
                        disabled={removeMember.isPending}
                        className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                        title="Remove"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Available */}
            {availableDevelopers.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
                  Available ({availableDevelopers.length})
                </p>
                <ul className="space-y-1.5">
                  {availableDevelopers.map((dev) => (
                    <li
                      key={dev.id}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold text-white shrink-0">
                        {dev.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{dev.name}</p>
                        <p className="text-xs text-gray-500 truncate">{dev.email}</p>
                      </div>
                      <button
                        onClick={() => addMember.mutate({ email: dev.email, role: 'VIEWER' })}
                        disabled={addMember.isPending}
                        className="p-1 rounded text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors shrink-0"
                        title="Assign"
                      >
                        <UserPlusIcon className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {filteredDevelopers.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-6">
                {allDevelopers.length === 0
                  ? 'No developer accounts exist yet. Create a user with the Developer role first.'
                  : 'No developers match your search.'}
              </p>
            )}

          </div>
        )}
      </div>
    </Modal>
  );
}
