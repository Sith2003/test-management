'use client';

import { useState } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Modal } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Spinner } from '@/shared/components/ui/Spinner';
import { useTestCases } from '@/features/test-cases/hooks/useTestCases';
import { useAddUatCases } from '@/features/uat/hooks/useUat';

interface AddUatCasesModalProps {
  projectId: string;
  sessionId: string;
  existingTestCaseIds: string[];
  isOpen: boolean;
  onClose: () => void;
}

// Inner component — only mounts when modal is open, so query always fetches fresh
function ModalContent({
  projectId,
  sessionId,
  existingTestCaseIds,
  onClose,
}: Omit<AddUatCasesModalProps, 'isOpen'>) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data, isLoading } = useTestCases(projectId, { limit: 500 });
  const addCases = useAddUatCases(projectId, sessionId);

  const allCases = data?.data ?? [];
  const available = allCases.filter((tc) => !existingTestCaseIds.includes(tc.id));
  const filtered = search.trim()
    ? available.filter((tc) => {
        const q = search.toLowerCase();
        return (
          tc.title.toLowerCase().includes(q) ||
          tc.caseId.toLowerCase().includes(q) ||
          (tc.suite?.name ?? '').toLowerCase().includes(q)
        );
      })
    : available;

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected(selected.size === filtered.length ? new Set() : new Set(filtered.map((tc) => tc.id)));
  };

  const handleAdd = () => {
    if (selected.size === 0) return;
    addCases.mutate([...selected], {
      onSuccess: () => {
        onClose();
      },
    });
  };

  return (
    <div>
      {/* Search */}
      <div className="relative mb-3">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search by title, ID or suite..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-9 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400"
          autoFocus
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Select-all bar */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg mb-2 text-sm border border-gray-100">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={filtered.length > 0 && selected.size === filtered.length}
              onChange={toggleAll}
              ref={(el) => {
                if (el) el.indeterminate = selected.size > 0 && selected.size < filtered.length;
              }}
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="font-medium text-gray-700">Select all</span>
          </label>
          <span className="text-xs text-gray-400">{filtered.length} test case{filtered.length !== 1 ? 's' : ''}</span>
        </div>
      )}

      {/* List */}
      <div className="border border-gray-200 rounded-lg overflow-hidden" style={{ maxHeight: 360, overflowY: 'auto' }}>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="md" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-400">
            {search
              ? 'No matching test cases.'
              : available.length === 0
              ? 'All test cases are already added to this session.'
              : 'No test cases found in this project.'}
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {filtered.map((tc) => (
              <li
                key={tc.id}
                onClick={() => toggle(tc.id)}
                className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selected.has(tc.id)}
                  onChange={() => toggle(tc.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-semibold text-primary-600 shrink-0">{tc.caseId}</span>
                    <span className="text-sm text-gray-900 truncate">{tc.title}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {tc.suite?.name && (
                      <span className="text-[11px] text-gray-400">{tc.suite.name}</span>
                    )}
                    <Badge variant={tc.priority}>{tc.priority}</Badge>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        <span className="text-sm text-gray-500">
          {selected.size > 0 ? `${selected.size} selected` : 'No cases selected'}
        </span>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={addCases.isPending}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleAdd}
            disabled={selected.size === 0}
            isLoading={addCases.isPending}
          >
            Add {selected.size > 0 ? `${selected.size} ` : ''}Case{selected.size !== 1 ? 's' : ''}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function AddUatCasesModal({ isOpen, onClose, ...props }: AddUatCasesModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Test Cases to UAT Session" size="xl">
      {isOpen && <ModalContent {...props} onClose={onClose} />}
    </Modal>
  );
}
