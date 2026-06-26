'use client';

import { useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Button } from '@/shared/components/ui/Button';
import { Spinner } from '@/shared/components/ui/Spinner';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { PageHeader } from '@/shared/components/PageHeader';
import { ProjectCard } from './ProjectCard';
import { CreateProjectModal } from './CreateProjectModal';
import { AssignDeveloperModal } from './AssignDeveloperModal';
import { useProjects, useDeleteProject } from '@/features/projects/hooks/useProjects';
import { useAuthStore } from '@/shared/stores/authStore';
import { UserRole, type Project } from '@/shared/types';

export function ProjectList() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState<Project | null>(null);
  const { data: projects, isLoading, isError } = useProjects();
  const deleteProject = useDeleteProject();
  const { user } = useAuthStore();
  const isTester = user?.role === UserRole.QA;
  const isReadOnly = isTester || user?.role === UserRole.DEVELOPER;
  const canManageMembers = user?.role === UserRole.ADMIN || user?.role === UserRole.MANAGER;

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      deleteProject.mutate(id);
    }
  };

  return (
    <div>
      <PageHeader
        title="Projects"
        description="Manage your test projects"
        actions={
          !isReadOnly && (
            <Button
              variant="primary"
              size="md"
              leftIcon={<PlusIcon className="h-4 w-4" />}
              onClick={() => setIsCreateOpen(true)}
            >
              New Project
            </Button>
          )
        }
      />

      {/* Content */}
      <div className="px-8 py-6">
        {isLoading && (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        )}

        {isError && (
          <div className="bg-red-50 text-red-700 rounded-lg p-4 text-sm border border-red-100">
            Failed to load projects. Please try again.
          </div>
        )}

        {!isLoading && !isError && projects?.length === 0 && (
          <EmptyState
            title="No projects yet"
            description="Create your first project to start managing test cases and runs."
            actionLabel={isReadOnly ? undefined : 'Create Project'}
            onAction={isReadOnly ? undefined : () => setIsCreateOpen(true)}
          />
        )}

        {!isLoading && !isError && projects && projects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onDelete={isReadOnly ? undefined : handleDelete}
                canManageMembers={canManageMembers}
                onAssignDeveloper={setAssignTarget}
              />
            ))}
          </div>
        )}
      </div>

      <CreateProjectModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />

      {assignTarget && (
        <AssignDeveloperModal
          projectId={assignTarget.id}
          projectName={assignTarget.name}
          isOpen={true}
          onClose={() => setAssignTarget(null)}
        />
      )}
    </div>
  );
}
