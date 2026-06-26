'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  FolderIcon,
  ClipboardDocumentListIcon,
  PlayIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  BugAntIcon,
  ClipboardDocumentCheckIcon,
  ExclamationTriangleIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { Spinner } from '@/shared/components/ui/Spinner';
import { PageHeader } from '@/shared/components/PageHeader';
import { ProjectCard } from '@/features/projects/components/ProjectCard';
import { dashboardService } from '@/features/dashboard/services/dashboardService';
import { useAuthStore } from '@/shared/stores/authStore';

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  iconBg: string;
  href?: string;
  note?: string;
}

function StatCard({ label, value, icon, iconBg, href, note }: StatCardProps) {
  const content = (
    <div className="bg-white rounded-xl ring-1 ring-gray-900/[0.06] p-5 flex items-center justify-between hover:ring-primary-200 hover:shadow-sm transition-all duration-200">
      <div>
        <p className="text-sm text-gray-500 mb-1">{label}</p>
        <p className="text-3xl font-bold text-gray-900 tracking-tight">{value}</p>
        {note && <p className="text-xs text-gray-400 mt-0.5">{note}</p>}
      </div>
      <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
        {icon}
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

export function DashboardStats() {
  const { user } = useAuthStore();
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: dashboardService.getStats,
  });

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: dashboardService.getDashboardSummary,
  });

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of your test management activity"
      />

      <div className="px-8 py-6 space-y-8">
        {/* Greeting */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {greeting()}, {user?.name?.split(' ')[0]} 👋
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Here&apos;s what&apos;s happening across your projects.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : (
          <>
            {/* First row — project-level stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard
                label="Total Projects"
                value={data?.totalProjects ?? 0}
                icon={<FolderIcon className="h-5 w-5 text-primary-600" />}
                iconBg="bg-primary-50"
                href="/projects"
              />
              <StatCard
                label="Test Cases"
                value={data?.totalCases ?? 0}
                icon={<ClipboardDocumentListIcon className="h-5 w-5 text-primary-500" />}
                iconBg="bg-primary-50"
              />
              <StatCard
                label="Test Runs"
                value={data?.totalRuns ?? 0}
                icon={<PlayIcon className="h-5 w-5 text-emerald-600" />}
                iconBg="bg-emerald-50"
              />
            </div>

            {/* Second row — cross-project action items */}
            {summaryLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-xl ring-1 ring-gray-900/[0.06] p-5 h-24 flex items-center justify-center"
                  >
                    <Spinner />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard
                  label="Open Defects"
                  value={summary?.openDefects ?? 0}
                  icon={<BugAntIcon className="h-5 w-5 text-red-600" />}
                  iconBg="bg-red-50"
                  href="/projects"
                  note="across all projects"
                />
                <StatCard
                  label="UAT Sessions In Progress"
                  value={summary?.uatPendingSignOff ?? 0}
                  icon={<ClipboardDocumentCheckIcon className="h-5 w-5 text-blue-600" />}
                  iconBg="bg-blue-50"
                />
                <StatCard
                  label="Cases Never Run"
                  value={summary?.neverRunCases ?? 0}
                  icon={<ExclamationTriangleIcon className="h-5 w-5 text-gray-500" />}
                  iconBg="bg-gray-100"
                />
                <StatCard
                  label="My Assigned Defects"
                  value={summary?.myAssignedDefects ?? 0}
                  icon={<UserCircleIcon className="h-5 w-5 text-purple-600" />}
                  iconBg="bg-purple-50"
                />
              </div>
            )}

            {/* Projects section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-gray-900">Your Projects</h3>
                <Link
                  href="/projects"
                  className="flex items-center gap-1 text-sm font-medium text-primary-500 hover:text-primary-600 transition-colors"
                >
                  View all
                  <ArrowRightIcon className="h-3.5 w-3.5" />
                </Link>
              </div>

              {data?.projects && data.projects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {data.projects.slice(0, 6).map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl ring-1 ring-gray-900/[0.06] p-10 text-center">
                  <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <CheckCircleIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-900 mb-1">No projects yet</p>
                  <p className="text-sm text-gray-500 mb-4">Create a project to get started.</p>
                  <Link
                    href="/projects"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-500 hover:text-primary-600"
                  >
                    Go to Projects <ArrowRightIcon className="h-3.5 w-3.5" />
                  </Link>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
