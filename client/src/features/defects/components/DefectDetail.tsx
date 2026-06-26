'use client';

import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { PageHeader } from '@/shared/components/PageHeader';
import { Badge } from '@/shared/components/ui/Badge';
import { Spinner } from '@/shared/components/ui/Spinner';
import { useDefect } from '@/features/defects/hooks/useDefects';
import { useUpdateDefect } from '@/features/defects/hooks/useDefects';
import { useAuthStore } from '@/shared/stores/authStore';
import { DefectComments } from './DefectComments';
import { DefectStatus, UserRole } from '@/shared/types';
import { formatDate } from '@/shared/utils/date';
import { DEFECT_STATUS_LABELS } from '@/features/defects/constants';

interface DefectDetailProps {
  projectId: string;
  defectId: string;
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value && value !== 0) return null;
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</dt>
      <dd className="text-sm text-gray-900">{value}</dd>
    </div>
  );
}

// Which transitions each role can trigger
// Dev can mark things Fixed; QA can verify/reopen; Manager/Admin can do all
function getAllowedTransitions(status: DefectStatus, role: UserRole): DefectStatus[] {
  const all: Record<DefectStatus, DefectStatus[]> = {
    [DefectStatus.OPEN]:        [DefectStatus.IN_PROGRESS, DefectStatus.WONTFIX],
    [DefectStatus.IN_PROGRESS]: [DefectStatus.FIXED, DefectStatus.OPEN, DefectStatus.WONTFIX],
    [DefectStatus.FIXED]:       [DefectStatus.RETEST, DefectStatus.IN_PROGRESS],
    [DefectStatus.RETEST]:      [DefectStatus.VERIFIED, DefectStatus.REOPENED],
    [DefectStatus.VERIFIED]:    [DefectStatus.CLOSED],
    [DefectStatus.REOPENED]:    [DefectStatus.IN_PROGRESS, DefectStatus.WONTFIX],
    [DefectStatus.CLOSED]:      [],
    [DefectStatus.WONTFIX]:     [],
  };

  const transitions = all[status] ?? [];

  if (role === UserRole.ADMIN || role === UserRole.MANAGER) return transitions;

  if (role === UserRole.DEVELOPER) {
    // Dev can only push forward toward Fixed
    return transitions.filter((s) => [DefectStatus.IN_PROGRESS, DefectStatus.FIXED].includes(s));
  }

  if (role === UserRole.QA) {
    // QA can do all except pushing back to IN_PROGRESS from FIXED
    return transitions;
  }

  return [];
}

const TRANSITION_BUTTON_STYLE: Partial<Record<DefectStatus, string>> = {
  [DefectStatus.FIXED]:    'bg-teal-600 hover:bg-teal-700 text-white',
  [DefectStatus.RETEST]:   'bg-purple-600 hover:bg-purple-700 text-white',
  [DefectStatus.VERIFIED]: 'bg-green-600 hover:bg-green-700 text-white',
  [DefectStatus.REOPENED]: 'bg-orange-500 hover:bg-orange-600 text-white',
  [DefectStatus.CLOSED]:   'bg-gray-500 hover:bg-gray-600 text-white',
  [DefectStatus.IN_PROGRESS]: 'bg-blue-600 hover:bg-blue-700 text-white',
  [DefectStatus.WONTFIX]:  'bg-gray-500 hover:bg-gray-600 text-white',
};

export function DefectDetail({ projectId, defectId }: DefectDetailProps) {
  const { data: defect, isLoading, isError } = useDefect(projectId, defectId);
  const updateDefect = useUpdateDefect(projectId);
  const { user } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError || !defect) {
    return (
      <div className="px-8 py-6">
        <div className="bg-red-50 text-red-700 rounded-xl p-6 text-sm border border-red-100">
          Defect not found or failed to load.
        </div>
      </div>
    );
  }

  const allowedTransitions = user ? getAllowedTransitions(defect.status, user.role) : [];

  const handleTransition = (newStatus: DefectStatus) => {
    updateDefect.mutate({ id: defect.id, input: { status: newStatus } });
  };

  return (
    <div>
      <PageHeader
        title={defect.title}
        description={`${defect.defectId} · Created ${formatDate(defect.createdAt)}`}
        actions={
          <Link
            href={`/projects/${projectId}/defects`}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Defects
          </Link>
        }
      />

      <div className="px-8 py-6 space-y-6">
        {/* Status action banner */}
        {allowedTransitions.length > 0 && (
          <div className="bg-white rounded-xl ring-1 ring-gray-900/[0.06] px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">Current status:</span>
              <Badge variant={defect.status}>{DEFECT_STATUS_LABELS[defect.status]}</Badge>
              {defect.retestCount > 0 && (
                <span className="text-xs bg-orange-50 text-orange-700 border border-orange-200 rounded-full px-2 py-0.5 font-medium">
                  Reopened {defect.retestCount}×
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-400">Move to:</span>
              {allowedTransitions.map((s) => (
                <button
                  key={s}
                  disabled={updateDefect.isPending}
                  onClick={() => handleTransition(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${TRANSITION_BUTTON_STYLE[s] ?? 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                >
                  {DEFECT_STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Rerun suggestion — shown after VERIFIED if linked test case exists */}
        {defect.status === DefectStatus.VERIFIED && defect.testCase && (
          <div className="bg-primary-50 border border-primary-200 rounded-xl px-5 py-4 flex items-center gap-3">
            <span className="text-primary-500 text-lg">✓</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-primary-800">Bug verified as fixed!</p>
              <p className="text-xs text-primary-600 mt-0.5">
                Consider re-running{' '}
                <Link
                  href={`/projects/${projectId}/cases/${defect.testCase.id}`}
                  className="font-semibold underline hover:text-primary-900"
                >
                  {defect.testCase.caseId} — {defect.testCase.title}
                </Link>{' '}
                to confirm the fix holds.
              </p>
            </div>
          </div>
        )}

        {/* Retest timeline */}
        {(defect.fixedAt || defect.verifiedAt) && (
          <div className="bg-white rounded-xl ring-1 ring-gray-900/[0.06] px-5 py-4">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Retest Timeline</h2>
            <ol className="flex items-center gap-0">
              <TimelineStep
                label="Reported"
                date={defect.createdAt}
                by={defect.createdBy?.name}
                color="bg-red-500"
                done
              />
              <TimelineLine done={!!defect.fixedAt} />
              <TimelineStep
                label="Fixed"
                date={defect.fixedAt}
                color="bg-teal-500"
                done={!!defect.fixedAt}
              />
              <TimelineLine done={!!defect.verifiedAt} />
              <TimelineStep
                label="Verified"
                date={defect.verifiedAt}
                by={defect.verifiedBy?.name}
                color="bg-green-500"
                done={!!defect.verifiedAt}
              />
            </ol>
          </div>
        )}

        {/* Main info card */}
        <div className="bg-white rounded-xl ring-1 ring-gray-900/[0.06] p-6">
          <div className="flex items-center gap-3 mb-5">
            <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-mono font-semibold text-gray-600">
              {defect.defectId}
            </span>
            <Badge variant={defect.status}>{DEFECT_STATUS_LABELS[defect.status]}</Badge>
            <Badge variant={defect.severity}>{defect.severity}</Badge>
            <Badge variant={defect.priority}>{defect.priority}</Badge>
          </div>

          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
            <Field label="Module" value={defect.module} />
            <Field label="Assigned To" value={defect.assignedTo?.name ?? 'Unassigned'} />
            <Field label="Created By" value={defect.createdBy?.name} />
            {defect.verifiedBy && (
              <Field label="Verified By" value={defect.verifiedBy.name} />
            )}
            <Field
              label="Linked Test Case"
              value={
                defect.testCase ? (
                  <Link
                    href={`/projects/${projectId}/cases/${defect.testCase.id}`}
                    className="text-primary-600 hover:text-primary-700"
                  >
                    {defect.testCase.caseId} — {defect.testCase.title}
                  </Link>
                ) : null
              }
            />
          </dl>
        </div>

        {/* Description / steps */}
        <div className="bg-white rounded-xl ring-1 ring-gray-900/[0.06] p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Details</h2>
          <div className="space-y-5">
            {defect.description && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Description</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{defect.description}</p>
              </div>
            )}
            {defect.stepsToReproduce && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Steps to Reproduce</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{defect.stepsToReproduce}</p>
              </div>
            )}
            {defect.expectedResult && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Expected Result</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{defect.expectedResult}</p>
              </div>
            )}
            {defect.actualResult && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Actual Result</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{defect.actualResult}</p>
              </div>
            )}
            {defect.bugPattern && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Bug Pattern</p>
                <p className="text-sm text-gray-700">{defect.bugPattern}</p>
              </div>
            )}
          </div>
        </div>

        {/* Comments */}
        <DefectComments projectId={projectId} defectId={defectId} />
      </div>
    </div>
  );
}

function TimelineStep({
  label, date, by, color, done,
}: {
  label: string;
  date: string | null | undefined;
  by?: string;
  color: string;
  done: boolean;
}) {
  return (
    <div className="flex flex-col items-center min-w-[100px]">
      <div className={`h-3 w-3 rounded-full border-2 ${done ? `${color} border-transparent` : 'bg-white border-gray-300'}`} />
      <p className={`mt-1 text-xs font-semibold ${done ? 'text-gray-800' : 'text-gray-400'}`}>{label}</p>
      {date && <p className="text-[11px] text-gray-400 text-center">{new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</p>}
      {by && <p className="text-[11px] text-gray-400">{by}</p>}
    </div>
  );
}

function TimelineLine({ done }: { done: boolean }) {
  return <div className={`flex-1 h-px mt-[-10px] ${done ? 'bg-gray-400' : 'bg-gray-200'}`} />;
}
