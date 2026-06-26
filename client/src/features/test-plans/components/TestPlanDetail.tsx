'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CalendarIcon, XMarkIcon, PlusIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Badge } from '@/shared/components/ui/Badge';
import { Spinner } from '@/shared/components/ui/Spinner';
import { Button } from '@/shared/components/ui/Button';
import { usePlan, useUpdatePlan, useLinkRun, useUnlinkRun } from '@/features/test-plans/hooks/usePlans';
import { useTestRuns } from '@/features/test-runs/hooks/useTestRuns';
import { PlanStatus, RunStatus } from '@/shared/types';

interface TestPlanDetailProps {
  projectId: string;
  planId: string;
}

const PLAN_STATUS_LABELS: Record<PlanStatus, string> = {
  [PlanStatus.DRAFT]: 'Draft',
  [PlanStatus.ACTIVE]: 'Active',
  [PlanStatus.COMPLETED]: 'Completed',
  [PlanStatus.ARCHIVED]: 'Archived',
};

const RUN_STATUS_LABELS: Record<RunStatus, string> = {
  [RunStatus.PENDING]: 'Pending',
  [RunStatus.IN_PROGRESS]: 'In Progress',
  [RunStatus.COMPLETED]: 'Completed',
  [RunStatus.ABORTED]: 'Aborted',
};

const STATUS_TRANSITIONS: Partial<Record<PlanStatus, PlanStatus>> = {
  [PlanStatus.DRAFT]: PlanStatus.ACTIVE,
  [PlanStatus.ACTIVE]: PlanStatus.COMPLETED,
  [PlanStatus.COMPLETED]: PlanStatus.ARCHIVED,
};

const TRANSITION_LABELS: Partial<Record<PlanStatus, string>> = {
  [PlanStatus.DRAFT]: 'Mark Active',
  [PlanStatus.ACTIVE]: 'Mark Completed',
  [PlanStatus.COMPLETED]: 'Archive',
};

export function TestPlanDetail({ projectId, planId }: TestPlanDetailProps) {
  const { data: plan, isLoading } = usePlan(projectId, planId);
  const updatePlan = useUpdatePlan(projectId, planId);
  const linkRun = useLinkRun(projectId, planId);
  const unlinkRun = useUnlinkRun(projectId, planId);
  const { data: allRuns } = useTestRuns(projectId);
  const [showLinkDropdown, setShowLinkDropdown] = useState(false);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="px-8 py-6">
        <div className="bg-red-50 text-red-700 rounded-xl p-6 text-sm border border-red-100">
          Test plan not found.
        </div>
      </div>
    );
  }

  const linkedRunIds = new Set((plan.testRuns ?? []).map((r) => r.id));
  const unlinkedRuns = (allRuns ?? []).filter((r) => !linkedRunIds.has(r.id));

  const nextStatus = STATUS_TRANSITIONS[plan.status];
  const nextLabel = TRANSITION_LABELS[plan.status];

  const targetDate = plan.targetDate
    ? new Date(plan.targetDate).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : null;

  const isOverdue =
    plan.targetDate &&
    plan.status !== PlanStatus.COMPLETED &&
    plan.status !== PlanStatus.ARCHIVED &&
    new Date(plan.targetDate) < new Date();

  return (
    <div>
      {/* Back link */}
      <div className="px-8 pt-6">
        <Link
          href={`/projects/${projectId}/plans`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Plans
        </Link>
      </div>

      <div className="px-8 pb-6 space-y-6">
        {/* Header card */}
        <div className="bg-white rounded-xl ring-1 ring-gray-900/[0.06] p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-lg font-semibold text-gray-900">{plan.name}</h1>
                <Badge variant={plan.status}>{PLAN_STATUS_LABELS[plan.status]}</Badge>
                {plan.sprint && (
                  <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2 py-0.5 font-medium">
                    {plan.sprint}
                  </span>
                )}
                {plan.version && (
                  <span className="text-xs bg-primary-50 text-primary-700 border border-primary-200 rounded-full px-2 py-0.5 font-medium">
                    v{plan.version}
                  </span>
                )}
              </div>
              {plan.description && (
                <p className="text-sm text-gray-600">{plan.description}</p>
              )}
            </div>

            {nextStatus && nextLabel && (
              <Button
                variant="primary"
                onClick={() => updatePlan.mutate({ status: nextStatus })}
                isLoading={updatePlan.isPending}
              >
                {nextLabel}
              </Button>
            )}
          </div>

          <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {targetDate && (
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">
                  Target Date
                </dt>
                <dd
                  className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-700'}`}
                >
                  <CalendarIcon className="h-3.5 w-3.5" />
                  {isOverdue ? '⚠️ ' : ''}
                  {targetDate}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">
                Created By
              </dt>
              <dd className="text-gray-700">{plan.createdBy.name}</dd>
            </div>
            {plan.assignees.length > 0 && (
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">
                  Assignees
                </dt>
                <dd className="text-gray-700">
                  {plan.assignees.map((a) => a.user.name).join(', ')}
                </dd>
              </div>
            )}
            {plan.progress && plan.progress.totalResults > 0 && (
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">
                  Pass Rate
                </dt>
                <dd className="text-gray-700 font-semibold">{plan.progress.passRate}%</dd>
              </div>
            )}
          </dl>

          {/* Progress bar */}
          {plan.progress && plan.progress.totalRuns > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                <span>
                  {plan.progress.completedRuns} / {plan.progress.totalRuns} runs completed
                </span>
                <span className="font-medium">
                  {Math.round(
                    (plan.progress.completedRuns / plan.progress.totalRuns) * 100
                  )}%
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 rounded-full transition-all"
                  style={{
                    width: `${Math.round(
                      (plan.progress.completedRuns / plan.progress.totalRuns) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Test Runs section */}
        <div className="bg-white rounded-xl ring-1 ring-gray-900/[0.06] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">
              Test Runs{' '}
              <span className="text-gray-400 font-normal">
                ({(plan.testRuns ?? []).length})
              </span>
            </h2>

            <div className="relative">
              <button
                onClick={() => setShowLinkDropdown(!showLinkDropdown)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <PlusIcon className="h-3.5 w-3.5" />
                Link Run
              </button>

              {showLinkDropdown && (
                <div className="absolute right-0 top-8 z-10 w-72 bg-white rounded-xl shadow-lg ring-1 ring-gray-900/[0.08] overflow-hidden">
                  <div className="px-3 py-2 border-b border-gray-100">
                    <p className="text-xs font-medium text-gray-700">Select a run to link</p>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {unlinkedRuns.length === 0 ? (
                      <p className="px-3 py-3 text-xs text-gray-400">
                        No unlinked runs available
                      </p>
                    ) : (
                      unlinkedRuns.map((run) => (
                        <button
                          key={run.id}
                          onClick={() => {
                            linkRun.mutate(run.id);
                            setShowLinkDropdown(false);
                          }}
                          className="w-full text-left px-3 py-2.5 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                        >
                          <p className="text-sm font-medium text-gray-900 truncate">{run.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {run.sprint ? `${run.sprint} · ` : ''}
                            {run.status.replace('_', ' ')}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {(plan.testRuns ?? []).length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">
              No runs linked yet. Click &quot;Link Run&quot; to associate test runs with this plan.
            </p>
          ) : (
            <div className="space-y-2">
              {plan.testRuns!.map((run) => (
                <div
                  key={run.id}
                  className="flex items-center gap-4 rounded-lg border border-gray-100 px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link
                        href={`/projects/${projectId}/runs/${run.id}`}
                        className="text-sm font-medium text-gray-900 hover:text-primary-600 transition-colors truncate"
                      >
                        {run.name}
                      </Link>
                      <Badge variant={run.status}>{RUN_STATUS_LABELS[run.status]}</Badge>
                    </div>
                    <div className="flex gap-4 text-xs text-gray-400">
                      <span>{run.stats.total} cases</span>
                      <span className="text-green-700">{run.stats.pass} pass</span>
                      {run.stats.fail > 0 && (
                        <span className="text-red-600">{run.stats.fail} fail</span>
                      )}
                      {run.stats.total > 0 && (
                        <span className="font-medium">{run.stats.passRate}% pass rate</span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => unlinkRun.mutate(run.id)}
                    disabled={unlinkRun.isPending}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                    title="Unlink from plan"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
