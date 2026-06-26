'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { PageHeader } from '@/shared/components/PageHeader';
import { Spinner } from '@/shared/components/ui/Spinner';
import { Button } from '@/shared/components/ui/Button';
import { ProjectMembersSection } from '@/features/projects/components/ProjectMembersSection';
import { useProject, useUpdateProject } from '@/features/projects/hooks/useProjects';
import { useAuthStore } from '@/shared/stores/authStore';
import { UserRole } from '@/shared/types';

interface Props {
  params: { projectId: string };
}

export default function ProjectSettingsPage({ params }: Props) {
  const { projectId } = params;
  const { user } = useAuthStore();
  const { data: project, isLoading } = useProject(projectId);
  const updateProject = useUpdateProject(projectId);

  const [editingInfo, setEditingInfo] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const canEditProject =
    user?.role === UserRole.ADMIN || user?.role === UserRole.MANAGER;

  const startEdit = () => {
    setName(project?.name ?? '');
    setDescription(project?.description ?? '');
    setEditingInfo(true);
  };

  const handleSaveInfo = () => {
    if (!name.trim()) return;
    updateProject.mutate(
      { name: name.trim(), description: description.trim() || undefined },
      { onSuccess: () => setEditingInfo(false) }
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Project not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-full flex flex-col">
      <PageHeader
        title="Project Settings"
        description={project.name}
        actions={
          <Link
            href={`/projects/${projectId}`}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Project
          </Link>
        }
      />

      <div className="px-8 py-6 space-y-6 max-w-3xl">

        {/* Project Info */}
        <div className="bg-white rounded-xl ring-1 ring-gray-900/[0.06] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Project Info</h3>
            {canEditProject && !editingInfo && (
              <button
                onClick={startEdit}
                className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                <PencilIcon className="h-3.5 w-3.5" />
                Edit
              </button>
            )}
          </div>

          {editingInfo ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 resize-none"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveInfo} isLoading={updateProject.isPending} className="text-xs">
                  <CheckIcon className="h-3.5 w-3.5 mr-1" />
                  Save
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setEditingInfo(false)}
                  className="text-xs"
                >
                  <XMarkIcon className="h-3.5 w-3.5 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <dl className="grid grid-cols-[auto_1fr] gap-x-8 gap-y-2 text-sm">
              <dt className="text-gray-500 text-xs">Name</dt>
              <dd className="text-gray-900 font-medium">{project.name}</dd>

              <dt className="text-gray-500 text-xs">Key</dt>
              <dd>
                <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                  {project.key}
                </span>
              </dd>

              <dt className="text-gray-500 text-xs">Description</dt>
              <dd className="text-gray-600 text-xs">
                {project.description || <span className="text-gray-300 italic">No description</span>}
              </dd>
            </dl>
          )}
        </div>

        {/* Members */}
        <ProjectMembersSection projectId={projectId} />

      </div>
    </div>
  );
}
