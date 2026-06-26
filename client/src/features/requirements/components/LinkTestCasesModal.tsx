'use client';

import { useState, useMemo } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { Modal } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';
import { Spinner } from '@/shared/components/ui/Spinner';
import { useLinkTestCase } from '../hooks/useRequirements';
import { useTestCases } from '@/features/test-cases/hooks/useTestCases';
import type { Requirement } from '@/shared/types';

interface LinkTestCasesModalProps {
  projectId: string;
  requirement: Requirement;
  isOpen: boolean;
  onClose: () => void;
}

export function LinkTestCasesModal({
  projectId,
  requirement,
  isOpen,
  onClose,
}: LinkTestCasesModalProps) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data: tcData, isLoading } = useTestCases(projectId);
  const linkTestCase = useLinkTestCase(projectId);

  // IDs already linked
  const alreadyLinked = useMemo(
    () => new Set((requirement.testCases ?? []).map((tc) => tc.id)),
    [requirement.testCases]
  );

  const allCases = tcData?.data ?? [];

  const filtered = allCases.filter((tc) => {
    if (alreadyLinked.has(tc.id)) return false;
    if (!search.trim()) return true;
    return (
      tc.title.toLowerCase().includes(search.toLowerCase()) ||
      tc.caseId.toLowerCase().includes(search.toLowerCase())
    );
  });

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleClose = () => {
    setSearch('');
    setSelected(new Set());
    onClose();
  };

  const handleSubmit = async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;

    // Link each selected test case sequentially
    for (const testCaseId of ids) {
      await linkTestCase.mutateAsync({ requirementId: requirement.id, testCaseId });
    }

    handleClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Link Test Cases — ${requirement.reqId}`}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={linkTestCase.isPending}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={linkTestCase.isPending}
            disabled={selected.size === 0}
          >
            Link {selected.size > 0 ? `(${selected.size})` : ''} Test Cases
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search test cases..."
            className="pl-9 pr-3 py-2 w-full text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400"
          />
        </div>

        {/* List */}
        <div className="max-h-64 overflow-y-auto border border-gray-100 rounded-lg divide-y divide-gray-100">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner size="md" className="text-primary-500" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              {allCases.length === 0
                ? 'No test cases in this project.'
                : 'No matching test cases found.'}
            </p>
          ) : (
            filtered.map((tc) => (
              <label
                key={tc.id}
                className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selected.has(tc.id)}
                  onChange={() => toggleSelect(tc.id)}
                  className="mt-0.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{tc.title}</p>
                  <p className="text-xs text-gray-400 font-mono">{tc.caseId}</p>
                </div>
              </label>
            ))
          )}
        </div>

        {alreadyLinked.size > 0 && (
          <p className="text-xs text-gray-400">
            {alreadyLinked.size} test case(s) already linked are hidden.
          </p>
        )}
      </div>
    </Modal>
  );
}
