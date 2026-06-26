'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { BugAntIcon } from '@heroicons/react/24/outline';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Spinner } from '@/shared/components/ui/Spinner';
import {
  useTestRun,
  useUpdateTestResult,
} from '@/features/test-runs/hooks/useTestRuns';
import { useProjectMembers } from '@/features/projects/hooks/useProjects';
import { CreateDefectModal } from '@/features/defects/components/CreateDefectModal';
import { ResultStatus, RunStatus } from '@/shared/types';

interface TestRunExecutorProps {
  projectId: string;
  runId: string;
}

const statusButtons: { status: ResultStatus; label: string; className: string }[] = [
  {
    status: ResultStatus.PASS,
    label: 'Pass',
    className: 'bg-green-100 text-green-800 hover:bg-green-200 border-green-300',
  },
  {
    status: ResultStatus.FAIL,
    label: 'Fail',
    className: 'bg-red-100 text-red-800 hover:bg-red-200 border-red-300',
  },
  {
    status: ResultStatus.BLOCKED,
    label: 'Blocked',
    className: 'bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-300',
  },
  {
    status: ResultStatus.SKIPPED,
    label: 'Skip',
    className: 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300',
  },
];

interface LogDefectTarget {
  testCaseId: string;
  testResultId: string;
  title: string;
  stepsToReproduce?: string;
}

export function TestRunExecutor({ projectId, runId }: TestRunExecutorProps) {
  const { data: run, isLoading } = useTestRun(projectId, runId);
  const results = run?.results ?? [];
  const updateResult = useUpdateTestResult(projectId, runId);
  const { data: members = [] } = useProjectMembers(projectId);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [defectTarget, setDefectTarget] = useState<LogDefectTarget | null>(null);

  const handleStatusChange = (resultId: string, status: ResultStatus) => {
    updateResult.mutate({
      resultId,
      input: { status, notes: notes[resultId] || undefined },
    });
  };

  const handleNotesChange = (resultId: string, value: string) => {
    setNotes((prev) => ({ ...prev, [resultId]: value }));
  };

  const handleNotesBlur = (resultId: string, currentStatus: ResultStatus) => {
    if (currentStatus !== ResultStatus.PENDING) {
      updateResult.mutate({
        resultId,
        input: {
          status: currentStatus,
          notes: notes[resultId] || undefined,
        },
      });
    }
  };

  if (!results && isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  const completedCount = results?.filter(
    (r) => r.status !== ResultStatus.PENDING
  ).length ?? 0;
  const totalCount = results?.length ?? 0;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const passCount = results?.filter((r) => r.status === ResultStatus.PASS).length ?? 0;
  const failCount = results?.filter((r) => r.status === ResultStatus.FAIL).length ?? 0;
  const blockedCount = results?.filter((r) => r.status === ResultStatus.BLOCKED).length ?? 0;

  return (
    <div>
      {/* Run header */}
      <div className="bg-white rounded-xl ring-1 ring-gray-900/[0.06] p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <p className="text-sm text-gray-500">{completedCount} of {totalCount} completed</p>
          {run && <Badge variant={run.status}>{run.status.replace('_', ' ')}</Badge>}
        </div>

        {/* Progress */}
        <div>
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
            <span>Progress</span>
            <span className="font-medium tabular-nums">{progressPct}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex gap-6 mt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
              {passCount} Pass
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
              {failCount} Fail
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-orange-500" />
              {blockedCount} Blocked
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-yellow-400" />
              {totalCount - completedCount} Pending
            </span>
          </div>
        </div>
      </div>

      {/* Results list */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="space-y-3">
          {results?.map((result, idx) => (
            <div
              key={result.id}
              className={clsx(
                'bg-white rounded-xl ring-1 p-5 transition-colors',
                result.status === ResultStatus.PASS && 'ring-green-200 bg-green-50/30',
                result.status === ResultStatus.FAIL && 'ring-red-200 bg-red-50/30',
                result.status === ResultStatus.BLOCKED && 'ring-orange-200 bg-orange-50/30',
                result.status === ResultStatus.SKIPPED && 'ring-gray-900/[0.06]',
                result.status === ResultStatus.PENDING && 'ring-gray-900/[0.06]'
              )}
            >
              <div className="flex items-start gap-4">
                <span className="text-sm font-medium text-gray-400 w-6 shrink-0 mt-0.5">
                  {idx + 1}
                </span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {result.testCase?.title ?? `Case ${result.testCaseId}`}
                    </h3>
                    {result.testCase?.priority && (
                      <Badge variant={result.testCase.priority}>
                        {result.testCase.priority}
                      </Badge>
                    )}
                  </div>

                  {/* Test steps preview */}
                  {result.testCase?.steps && result.testCase.steps.length > 0 && (
                    <div className="mb-3 space-y-1">
                      {result.testCase.steps.slice(0, 3).map((step, si) => (
                        <div key={step.id} className="text-xs text-gray-500">
                          <span className="font-medium">Step {si + 1}:</span>{' '}
                          {step.action}
                        </div>
                      ))}
                      {result.testCase.steps.length > 3 && (
                        <div className="text-xs text-gray-400">
                          +{result.testCase.steps.length - 3} more steps
                        </div>
                      )}
                    </div>
                  )}

                  {/* Notes */}
                  <textarea
                    value={notes[result.id] ?? result.notes ?? ''}
                    onChange={(e) => handleNotesChange(result.id, e.target.value)}
                    onBlur={() => handleNotesBlur(result.id, result.status)}
                    placeholder="Add notes..."
                    rows={2}
                    className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 resize-none transition-colors"
                    disabled={run?.status === RunStatus.COMPLETED}
                  />

                  {/* Assignee */}
                  {members.length > 0 && (
                    <div className="flex items-center gap-2 mt-1">
                      <label className="text-xs text-gray-400 shrink-0">Assignee:</label>
                      <select
                        value={result.assigneeId ?? ''}
                        onChange={(e) =>
                          updateResult.mutate({
                            resultId: result.id,
                            input: {
                              status: result.status,
                              assigneeId: e.target.value || null,
                            },
                          })
                        }
                        disabled={run?.status === RunStatus.COMPLETED}
                        className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 bg-white disabled:opacity-50"
                      >
                        <option value="">Unassigned</option>
                        {members.filter((m) => m.user).map((m) => (
                          <option key={m.user!.id} value={m.user!.id}>
                            {m.user!.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Status buttons */}
                <div className="flex flex-col gap-1.5 shrink-0">
                  {statusButtons.map(({ status, label, className }) => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(result.id, status)}
                      disabled={
                        run?.status === RunStatus.COMPLETED ||
                        updateResult.isPending
                      }
                      className={clsx(
                        'px-3 py-1 rounded text-xs font-medium border transition-all',
                        className,
                        result.status === status &&
                          'ring-2 ring-offset-1 ring-current font-bold',
                        'disabled:opacity-50 disabled:cursor-not-allowed'
                      )}
                    >
                      {label}
                    </button>
                  ))}

                  {/* Log Defect shortcut — shown when FAIL or BLOCKED */}
                  {(result.status === ResultStatus.FAIL || result.status === ResultStatus.BLOCKED) &&
                    run?.status !== RunStatus.COMPLETED && (
                      <button
                        onClick={() =>
                          setDefectTarget({
                            testCaseId: result.testCaseId,
                            testResultId: result.id,
                            title: `[${result.testCase?.caseId ?? 'TC'}] ${result.testCase?.title ?? 'Defect'}`,
                            stepsToReproduce: result.testCase?.steps
                              ?.map((s, i) => `${i + 1}. ${s.action}`)
                              .join('\n'),
                          })
                        }
                        className="mt-1 px-3 py-1 rounded text-xs font-medium border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors flex items-center gap-1 justify-center"
                      >
                        <BugAntIcon className="h-3 w-3" />
                        Log Defect
                      </button>
                    )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {defectTarget && (
        <CreateDefectModal
          projectId={projectId}
          isOpen={!!defectTarget}
          onClose={() => setDefectTarget(null)}
          initialValues={{
            title: defectTarget.title,
            testCaseId: defectTarget.testCaseId,
            testResultId: defectTarget.testResultId,
            stepsToReproduce: defectTarget.stepsToReproduce,
          }}
        />
      )}
    </div>
  );
}
