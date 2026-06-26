'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ClipboardDocumentListIcon,
  PlayIcon,
  FolderOpenIcon,
  ArrowUpTrayIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { Spinner } from '@/shared/components/ui/Spinner';
import { PageHeader } from '@/shared/components/PageHeader';
import {
  BugAntIcon,
  ClockIcon,
  CheckBadgeIcon,
  UserGroupIcon as TeamIcon,
} from '@heroicons/react/24/outline';
import { useProject, useProjectStats } from '@/features/projects/hooks/useProjects';
import { ActivityFeed } from '@/features/activity/components/ActivityFeed';

interface ProjectDetailPageProps {
  params: { projectId: string };
}

interface QuickLinkProps {
  href: string;
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
  count?: number;
}

function QuickLink({ href, icon, iconBg, title, description, count }: QuickLinkProps) {
  return (
    <Link
      href={href}
      className="bg-white rounded-xl ring-1 ring-gray-900/[0.06] p-6 hover:ring-primary-200 hover:shadow-sm transition-all group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
          {icon}
        </div>
        {count !== undefined && (
          <span className="text-2xl font-bold text-gray-900 tabular-nums">{count}</span>
        )}
      </div>
      <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
      <p className="mt-0.5 text-xs text-gray-500">{description}</p>
    </Link>
  );
}

interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  color: string;
}

function KpiCard({ label, value, sub, icon, color }: KpiCardProps) {
  return (
    <div className="bg-white rounded-xl ring-1 ring-gray-900/[0.06] px-5 py-4 flex items-center gap-4">
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900 leading-tight tabular-nums">{value}</p>
        {sub && <p className="text-[11px] text-gray-400">{sub}</p>}
      </div>
    </div>
  );
}

export default function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { projectId } = params;
  const router = useRouter();
  const { data: project, isLoading } = useProject(projectId);
  const { data: stats } = useProjectStats(projectId);

  useEffect(() => {
    router.replace(`/projects/${projectId}/overview`);
  }, [projectId, router]);

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
        title={project.name}
        description={project.description ?? undefined}
        actions={
          <span className="text-xs font-mono bg-gray-100 text-gray-500 px-2.5 py-1 rounded-md">
            {project.key}
          </span>
        }
      />

      {/* KPI Stats */}
      {stats && (
        <div className="px-8 pt-6 grid grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard
            label="Pass Rate"
            value={`${((stats.passRate ?? 0) * 100).toFixed(1)}%`}
            sub="Across all runs"
            icon={<CheckBadgeIcon className="h-5 w-5 text-emerald-600" />}
            color="bg-emerald-50"
          />
          <KpiCard
            label="Open Defects"
            value={stats.openDefects ?? 0}
            sub="Not closed / wontfix"
            icon={<BugAntIcon className="h-5 w-5 text-red-500" />}
            color="bg-red-50"
          />
          <KpiCard
            label="Pending Review"
            value={stats.pendingReview ?? 0}
            sub="Draft or ready cases"
            icon={<ClockIcon className="h-5 w-5 text-amber-500" />}
            color="bg-amber-50"
          />
          <KpiCard
            label="Members"
            value={project._count?.members ?? 0}
            sub={`${stats.totalCases} test cases`}
            icon={<TeamIcon className="h-5 w-5 text-primary-600" />}
            color="bg-primary-50"
          />
        </div>
      )}

      <div className="px-8 py-6 grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6 items-start">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <QuickLink
            href={`/projects/${projectId}/cases`}
            icon={<ClipboardDocumentListIcon className="h-5 w-5 text-primary-600" />}
            iconBg="bg-primary-50"
            title="Test Cases"
            description="Manage and organize your test cases"
            count={project._count?.testCases ?? 0}
          />
          <QuickLink
            href={`/projects/${projectId}/runs`}
            icon={<PlayIcon className="h-5 w-5 text-primary-500" />}
            iconBg="bg-primary-50"
            title="Test Runs"
            description="Execute and track test runs"
            count={project._count?.testRuns ?? 0}
          />
          <QuickLink
            href={`/projects/${projectId}/cases`}
            icon={<FolderOpenIcon className="h-5 w-5 text-amber-600" />}
            iconBg="bg-amber-50"
            title="Suites"
            description="Organize test cases in suites"
            count={project._count?.testSuites ?? 0}
          />
          <QuickLink
            href={`/projects/${projectId}/upload`}
            icon={<ArrowUpTrayIcon className="h-5 w-5 text-emerald-600" />}
            iconBg="bg-emerald-50"
            title="Import"
            description="Bulk import test cases from Excel or CSV"
          />
          <QuickLink
            href={`/projects/${projectId}/reports`}
            icon={<ChartBarIcon className="h-5 w-5 text-primary-500" />}
            iconBg="bg-primary-50"
            title="Reports"
            description="View test metrics and analytics"
          />
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl ring-1 ring-gray-900/[0.06] p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <ActivityFeed projectId={projectId} limit={30} />
        </div>
      </div>
    </div>
  );
}
