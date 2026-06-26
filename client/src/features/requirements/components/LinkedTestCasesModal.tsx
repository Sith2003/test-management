'use client';

import Link from 'next/link';
import { XMarkIcon, BeakerIcon } from '@heroicons/react/24/outline';
import { Spinner } from '@/shared/components/ui/Spinner';
import { useRequirement } from '../hooks/useRequirements';
import type { Requirement } from '@/shared/types';

interface Props {
  projectId: string;
  requirement: Requirement;
  isOpen: boolean;
  onClose: () => void;
}

const STATUS_STYLES: Record<string, string> = {
  PASS: 'bg-green-100 text-green-700',
  FAIL: 'bg-red-100 text-red-700',
  BLOCKED: 'bg-amber-100 text-amber-700',
  SKIPPED: 'bg-gray-100 text-gray-500',
  PENDING: 'bg-blue-50 text-blue-500',
};

export function LinkedTestCasesModal({ projectId, requirement, isOpen, onClose }: Props) {
  const { data: req, isLoading } = useRequirement(projectId, requirement.id);

  if (!isOpen) return null;

  const testCases = req?.testCases ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-400 font-mono">{requirement.reqId}</p>
            <h2 className="text-base font-semibold text-gray-900 mt-0.5 leading-snug">
              Linked Test Cases
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 max-h-[28rem]">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Spinner size="md" className="text-primary-500" />
            </div>
          ) : testCases.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <BeakerIcon className="h-8 w-8 text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">No test cases linked yet.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {testCases.map((item) => {
                // Backend returns junction records: { testCase: { id, caseId, title, lastExecutionStatus } }
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const tc = (item as any).testCase ?? item;
                const status = tc.lastExecutionStatus ?? null;
                const statusKey = status ?? 'PENDING';
                const statusStyle = STATUS_STYLES[statusKey] ?? STATUS_STYLES.PENDING;
                return (
                  <li key={tc.id} className="py-3 flex items-center gap-3">
                    <span className="font-mono text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded shrink-0">
                      {tc.caseId}
                    </span>
                    <Link
                      href={`/projects/${projectId}/cases/${tc.id}/edit`}
                      className="flex-1 text-sm text-gray-800 hover:text-primary-600 truncate transition-colors"
                      onClick={onClose}
                    >
                      {tc.title}
                    </Link>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${statusStyle}`}>
                      {status ? status : 'Not Run'}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        {!isLoading && testCases.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/60">
            <p className="text-xs text-gray-400">{testCases.length} test case{testCases.length !== 1 ? 's' : ''} linked</p>
          </div>
        )}
      </div>
    </div>
  );
}
