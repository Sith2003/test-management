'use client';

import { useState } from 'react';
import clsx from 'clsx';
import {
  CheckCircleIcon,
  XCircleIcon,
  CalendarIcon,
  LinkIcon,
  UserIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Spinner } from '@/shared/components/ui/Spinner';
import {
  useUatSession,
  useUpdateUatResult,
  useSignOffUat,
} from '@/features/uat/hooks/useUat';
import { UatResultStatus, UatSessionStatus } from '@/shared/types';
import { AddUatCasesModal } from './AddUatCasesModal';
import { formatDate, formatDateRange } from '@/shared/utils/date';

interface UatExecutorProps {
  projectId: string;
  sessionId: string;
}

const uatStatusButtons: {
  status: UatResultStatus;
  label: string;
  className: string;
}[] = [
  {
    status: UatResultStatus.PASS,
    label: 'Pass',
    className: 'bg-green-100 text-green-800 hover:bg-green-200 border-green-300',
  },
  {
    status: UatResultStatus.FAIL,
    label: 'Fail',
    className: 'bg-red-100 text-red-800 hover:bg-red-200 border-red-300',
  },
  {
    status: UatResultStatus.BLOCKED,
    label: 'Blocked',
    className: 'bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-300',
  },
];

const textareaClass =
  'w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 resize-none transition-colors placeholder-gray-400';

export function UatExecutor({ projectId, sessionId }: UatExecutorProps) {
  const { data: session, isLoading } = useUatSession(projectId, sessionId);
  const updateResult = useUpdateUatResult(projectId, sessionId);
  const signOffUat = useSignOffUat(projectId, sessionId);

  // Local textarea state
  const [localActual, setLocalActual] = useState<Record<string, string>>({});
  const [localComments, setLocalComments] = useState<Record<string, string>>({});

  const [showAddCases, setShowAddCases] = useState(false);

  // Sign-off form state
  const [showSignOff, setShowSignOff] = useState(false);
  const [signOffDecision, setSignOffDecision] = useState<'ACCEPTED' | 'REJECTED'>('ACCEPTED');
  const [signOffNote, setSignOffNote] = useState('');

  const handleStatusClick = (resultId: string, status: UatResultStatus) => {
    updateResult.mutate({
      resultId,
      data: {
        status,
        actualResult: localActual[resultId],
        comments: localComments[resultId],
      },
    });
  };

  const handleSignOffSubmit = () => {
    signOffUat.mutate(
      { decision: signOffDecision, note: signOffNote.trim() || undefined },
      {
        onSuccess: () => {
          setShowSignOff(false);
          setSignOffNote('');
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="bg-red-50 text-red-700 rounded-lg p-4 text-sm border border-red-100">
        Session not found.
      </div>
    );
  }

  const results = session.results ?? [];
  const totalCount = results.length;
  const completedCount = results.filter(
    (r) => r.status !== UatResultStatus.PENDING
  ).length;
  const passCount = results.filter((r) => r.status === UatResultStatus.PASS).length;
  const failCount = results.filter((r) => r.status === UatResultStatus.FAIL).length;
  const blockedCount = results.filter((r) => r.status === UatResultStatus.BLOCKED).length;
  const progressPct =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const isTerminal =
    session.status === UatSessionStatus.SIGNED_OFF ||
    session.status === UatSessionStatus.REJECTED;

  const dateRange = session.uatStartDate ? formatDateRange(session.uatStartDate, session.uatEndDate) : null;

  return (
    <div className="space-y-5">
      {/* ── Session header card ── */}
      <div className="bg-white rounded-xl ring-1 ring-gray-900/[0.06] p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center rounded-md bg-primary-50 px-2 py-0.5 text-xs font-semibold text-primary-700 ring-1 ring-inset ring-primary-700/10">
                {session.sessionId}
              </span>
              <Badge variant={session.status}>
                {session.status.replace('_', ' ')}
              </Badge>
            </div>
            <h2 className="text-base font-semibold text-gray-900 truncate">
              {session.name}
            </h2>
          </div>

          {/* Action buttons — only when active */}
          {!isTerminal && !showSignOff && (
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<PlusIcon className="h-4 w-4" />}
                onClick={() => setShowAddCases(true)}
              >
                Add Test Cases
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowSignOff(true)}
              >
                Sign Off
              </Button>
            </div>
          )}
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-gray-500 mb-4">
          {session.version && (
            <span>
              <span className="font-medium text-gray-600">Version:</span>{' '}
              {session.version}
            </span>
          )}
          {dateRange && (
            <span className="flex items-center gap-1">
              <CalendarIcon className="h-3.5 w-3.5 text-gray-400" />
              {dateRange}
            </span>
          )}
          {session.environmentUrl && (
            <span className="flex items-center gap-1 min-w-0">
              <LinkIcon className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              <a
                href={session.environmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-700 truncate max-w-[220px]"
              >
                {session.environmentUrl}
              </a>
            </span>
          )}
          {session.supportContact && (
            <span className="flex items-center gap-1">
              <UserIcon className="h-3.5 w-3.5 text-gray-400" />
              {session.supportContact}
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
            <span>{completedCount} of {totalCount} completed</span>
            <span className="font-medium tabular-nums">{progressPct}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex gap-5 mt-2.5 text-xs text-gray-500">
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

        {/* Sign-off inline form */}
        {showSignOff && (
          <div className="mt-5 pt-5 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Sign Off Session</h3>
            <div className="flex items-center gap-5 mb-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="signOffDecision"
                  value="ACCEPTED"
                  checked={signOffDecision === 'ACCEPTED'}
                  onChange={() => setSignOffDecision('ACCEPTED')}
                  className="h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-green-700">Accept</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="signOffDecision"
                  value="REJECTED"
                  checked={signOffDecision === 'REJECTED'}
                  onChange={() => setSignOffDecision('REJECTED')}
                  className="h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-red-700">Reject</span>
              </label>
            </div>
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Note <span className="text-gray-400">(optional)</span>
              </label>
              <textarea
                rows={3}
                className={textareaClass}
                placeholder="Add a sign-off note..."
                value={signOffNote}
                onChange={(e) => setSignOffNote(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={handleSignOffSubmit}
                isLoading={signOffUat.isPending}
                className={
                  signOffDecision === 'REJECTED'
                    ? '!bg-red-600 !border-red-600 hover:!bg-red-700'
                    : ''
                }
              >
                {signOffDecision === 'ACCEPTED' ? 'Accept & Sign Off' : 'Reject Session'}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setShowSignOff(false);
                  setSignOffNote('');
                }}
                disabled={signOffUat.isPending}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Sign-off banner (terminal states) ── */}
      {isTerminal && (
        <div
          className={clsx(
            'rounded-xl p-4 flex items-start gap-3 ring-1',
            session.status === UatSessionStatus.SIGNED_OFF
              ? 'bg-green-50 ring-green-200'
              : 'bg-red-50 ring-red-200'
          )}
        >
          {session.status === UatSessionStatus.SIGNED_OFF ? (
            <CheckCircleIcon className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
          ) : (
            <XCircleIcon className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          )}
          <div className="min-w-0">
            <p
              className={clsx(
                'text-sm font-semibold',
                session.status === UatSessionStatus.SIGNED_OFF
                  ? 'text-green-800'
                  : 'text-red-800'
              )}
            >
              {session.status === UatSessionStatus.SIGNED_OFF
                ? 'Session Signed Off'
                : 'Session Rejected'}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {session.signOffBy?.name && (
                <span>By {session.signOffBy.name}</span>
              )}
              {session.signedOffAt && (
                <span> &middot; {formatDate(session.signedOffAt)}</span>
              )}
            </p>
            {session.signOffNote && (
              <p className="text-xs text-gray-600 mt-1 italic">
                &ldquo;{session.signOffNote}&rdquo;
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Add Test Cases Modal ── */}
      <AddUatCasesModal
        projectId={projectId}
        sessionId={sessionId}
        existingTestCaseIds={results.map((r) => r.testCaseId)}
        isOpen={showAddCases}
        onClose={() => setShowAddCases(false)}
      />

      {/* ── Results list ── */}
      {results.length === 0 ? (
        <div className="bg-white rounded-xl ring-1 ring-gray-900/[0.06] p-8 text-center">
          <p className="text-sm text-gray-500">
            No test cases assigned to this session yet.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {results.map((result, idx) => (
            <div
              key={result.id}
              className={clsx(
                'bg-white rounded-xl ring-1 p-5 transition-colors',
                result.status === UatResultStatus.PASS &&
                  'ring-green-200 bg-green-50/30',
                result.status === UatResultStatus.FAIL &&
                  'ring-red-200 bg-red-50/30',
                result.status === UatResultStatus.BLOCKED &&
                  'ring-orange-200 bg-orange-50/30',
                result.status === UatResultStatus.PENDING && 'ring-gray-900/[0.06]'
              )}
            >
              <div className="flex items-start gap-4">
                {/* Index */}
                <span className="text-sm font-medium text-gray-400 w-6 shrink-0 mt-0.5">
                  {idx + 1}
                </span>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Title + current status badge */}
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {result.testCase?.title ?? result.testCaseId}
                    </h3>
                    <Badge variant={result.status}>{result.status}</Badge>
                  </div>

                  {/* Description */}
                  {result.testCase?.description && (
                    <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                      {result.testCase.description}
                    </p>
                  )}

                  {/* Actual Result */}
                  <div className="mb-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Actual Result
                    </label>
                    <textarea
                      rows={2}
                      className={textareaClass}
                      placeholder="Describe what actually happened..."
                      value={
                        localActual[result.id] ?? result.actualResult ?? ''
                      }
                      onChange={(e) =>
                        setLocalActual((prev) => ({
                          ...prev,
                          [result.id]: e.target.value,
                        }))
                      }
                      disabled={isTerminal}
                    />
                  </div>

                  {/* Comments */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Comments
                    </label>
                    <textarea
                      rows={2}
                      className={textareaClass}
                      placeholder="Additional notes or observations..."
                      value={
                        localComments[result.id] ?? result.comments ?? ''
                      }
                      onChange={(e) =>
                        setLocalComments((prev) => ({
                          ...prev,
                          [result.id]: e.target.value,
                        }))
                      }
                      disabled={isTerminal}
                    />
                  </div>
                </div>

                {/* Status buttons */}
                <div className="flex flex-col gap-1.5 shrink-0">
                  {uatStatusButtons.map(({ status, label, className }) => (
                    <button
                      key={status}
                      onClick={() => handleStatusClick(result.id, status)}
                      disabled={isTerminal || updateResult.isPending}
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
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
