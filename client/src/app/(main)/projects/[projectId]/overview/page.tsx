'use client';

import {
  ClipboardDocumentListIcon,
  PlayIcon,
  BugAntIcon,
  CheckCircleIcon,
  CalendarDaysIcon,
  KeyIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { PageHeader } from '@/shared/components/PageHeader';
import { Badge } from '@/shared/components/ui/Badge';
import { Spinner } from '@/shared/components/ui/Spinner';
import { useProject, useProjectMembers } from '@/features/projects/hooks/useProjects';
import { useSummaryReport } from '@/features/reports/hooks/useReports';
import { ProjectMemberRole } from '@/shared/types';
import { formatDate } from '@/shared/utils/date';

interface Props {
  params: { projectId: string };
}

const ROLE_STYLE: Record<ProjectMemberRole, string> = {
  [ProjectMemberRole.ADMIN]:   'bg-rose-100 text-rose-700',
  [ProjectMemberRole.MANAGER]: 'bg-primary-100 text-primary-700',
  [ProjectMemberRole.QA]:      'bg-emerald-100 text-emerald-700',
  [ProjectMemberRole.VIEWER]:  'bg-gray-100 text-gray-500',
};

interface StatTileProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}

function StatTile({ label, value, icon, iconBg, iconColor }: StatTileProps) {
  return (
    <div className="bg-white rounded-xl ring-1 ring-gray-900/[0.06] px-5 py-4 flex items-center gap-4">
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
        <span className={iconColor}>{icon}</span>
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900 leading-tight tabular-nums">{value}</p>
      </div>
    </div>
  );
}

export default function OverviewPage({ params }: Props) {
  const { projectId } = params;
  const { data: project, isLoading: loadingProject } = useProject(projectId);
  const { data: members, isLoading: loadingMembers } = useProjectMembers(projectId);
  const { data: summary } = useSummaryReport(projectId);

  if (loadingProject) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" className="text-primary-500" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-20 text-sm text-gray-500">Project not found.</div>
    );
  }

  const passRatePct = summary ? Math.round((summary.passRate ?? 0) * 100) : null;

  return (
    <div>
      <PageHeader
        title={project.name}
        description="Project overview and team information"
        actions={
          <span className="font-mono text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-md">
            {project.key}
          </span>
        }
      />

      <div className="px-8 py-6 space-y-6">

        {/* Stats row */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatTile
            label="Test Cases"
            value={project._count?.testCases ?? 0}
            icon={<ClipboardDocumentListIcon className="h-5 w-5" />}
            iconBg="bg-primary-50"
            iconColor="text-primary-600"
          />
          <StatTile
            label="Test Runs"
            value={project._count?.testRuns ?? 0}
            icon={<PlayIcon className="h-5 w-5" />}
            iconBg="bg-primary-50"
            iconColor="text-primary-500"
          />
          <StatTile
            label="Open Defects"
            value={summary?.openDefects ?? '—'}
            icon={<BugAntIcon className="h-5 w-5" />}
            iconBg="bg-red-50"
            iconColor="text-red-500"
          />
          <StatTile
            label="Pass Rate"
            value={passRatePct !== null ? `${passRatePct}%` : '—'}
            icon={<CheckCircleIcon className="h-5 w-5" />}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
          />
        </div>

        {/* About + Project Info */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-6">

          {/* About */}
          <div className="bg-white rounded-xl ring-1 ring-gray-900/[0.06] p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">About</h2>
            {project.description ? (
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                {project.description}
              </p>
            ) : (
              <p className="text-sm text-gray-400 italic">No description provided for this project.</p>
            )}
          </div>

          {/* Project Info */}
          <div className="bg-white rounded-xl ring-1 ring-gray-900/[0.06] p-6 space-y-4">
            <h2 className="text-sm font-semibold text-gray-900">Project Info</h2>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <KeyIcon className="h-4 w-4 text-gray-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">Project Key</p>
                  <p className="text-sm font-mono font-medium text-gray-800">{project.key}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <CalendarDaysIcon className="h-4 w-4 text-gray-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">Created</p>
                  <p className="text-sm text-gray-800">{formatDate(project.createdAt)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <CalendarDaysIcon className="h-4 w-4 text-gray-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">Last Updated</p>
                  <p className="text-sm text-gray-800">{formatDate(project.updatedAt)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <UserCircleIcon className="h-4 w-4 text-gray-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">Members</p>
                  <p className="text-sm text-gray-800">{project._count?.members ?? 0} people</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <CheckCircleIcon className="h-4 w-4 text-gray-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">Status</p>
                  <span className="inline-flex items-center gap-1.5 text-sm">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
                    <span className="text-gray-800">Active</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Team Members */}
        <div className="bg-white rounded-xl ring-1 ring-gray-900/[0.06] overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Team Members</h2>
            <p className="text-xs text-gray-500 mt-0.5">People with access to this project</p>
          </div>

          {loadingMembers ? (
            <div className="flex justify-center py-10">
              <Spinner size="md" className="text-primary-500" />
            </div>
          ) : !members || members.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">No members found.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50/80 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {members.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-full bg-primary-100 flex items-center justify-center text-xs font-semibold text-primary-700 shrink-0">
                          {(member.user?.name ?? '?').charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900">{member.user?.name ?? '—'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-gray-500">{member.user?.email ?? '—'}</td>
                    <td className="px-6 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_STYLE[member.role] ?? 'bg-gray-100 text-gray-500'}`}>
                        {member.role}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-gray-400 text-xs">{formatDate(member.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  );
}
