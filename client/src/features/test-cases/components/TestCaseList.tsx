'use client';

import { Fragment, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Spinner } from '@/shared/components/ui/Spinner';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { Pagination } from '@/shared/components/ui/Pagination';
import { Modal } from '@/shared/components/ui/Modal';
import { Select } from '@/shared/components/ui/Select';
import { TestSuiteTree } from './TestSuiteTree';
import {
  useTestCases,
  useDeleteTestCase,
  useBulkUpdateTestCases,
  useSuites,
  useTestCaseScenarios,
} from '@/features/test-cases/hooks/useTestCases';
import { Priority, CaseStatus, ReviewStatus, type TestCase, type TestCaseFilters } from '@/shared/types';

interface TestCaseListProps {
  projectId: string;
}

const COL_COUNT = 12;

// ─── Inline detail row ─────────────────────────────────────────────────────────
function DetailRow({ tc }: { tc: TestCase }) {
  const hasSteps = tc.steps && tc.steps.length > 0;
  const hasAny = tc.description || tc.preconditions || tc.expectedResult || tc.testData || hasSteps;

  if (!hasAny) return null;

  return (
    <tr>
      <td colSpan={COL_COUNT} className="p-0 border-b border-primary-100/80 bg-primary-50/20">
        <div className="pl-[164px] pr-6 py-4 space-y-4">
          {/* Meta fields */}
          {(tc.description || tc.preconditions || tc.expectedResult || tc.testData) && (
            <div className="grid grid-cols-2 gap-x-10 gap-y-3.5">
              {tc.description && (
                <div className="col-span-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Description</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{tc.description}</p>
                </div>
              )}
              {tc.preconditions && (
                <div className="col-span-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Preconditions</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{tc.preconditions}</p>
                </div>
              )}
              {tc.expectedResult && (
                <div className="col-span-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Expected Result</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{tc.expectedResult}</p>
                </div>
              )}
              {tc.testData && (
                <div className="col-span-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Test Data</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{tc.testData}</p>
                </div>
              )}
            </div>
          )}

          {/* Steps */}
          {hasSteps && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                Steps ({tc.steps!.length})
              </p>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-left">
                    <th className="pb-1.5 w-8 font-semibold text-gray-400">#</th>
                    <th className="pb-1.5 font-semibold text-gray-400">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tc.steps!.map((step, i) => (
                    <tr key={step.id} className="border-b border-gray-100 last:border-0">
                      <td className="py-1.5 text-gray-400 align-top">{i + 1}</td>
                      <td className="py-1.5 text-gray-700 align-top">{step.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────
export function TestCaseList({ projectId }: TestCaseListProps) {
  const router = useRouter();
  const [filters, setFilters] = useState<TestCaseFilters>({ page: 1, limit: 25 });
  const [searchInput, setSearchInput] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [moveSuiteId, setMoveSuiteId] = useState('');
  const [bulkStatus, setBulkStatus] = useState('');
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const { data, isLoading, isError } = useTestCases(projectId, filters);
  const deleteTestCase = useDeleteTestCase(projectId);
  const bulkUpdate = useBulkUpdateTestCases(projectId);
  const { data: suites } = useSuites(projectId);
  const { data: scenarios } = useTestCaseScenarios(projectId);

  const testCases = data?.data ?? [];
  const pagination = data?.pagination;

  const allVisibleIds = testCases.map((tc) => tc.id);
  const isAllSelected = allVisibleIds.length > 0 && allVisibleIds.every((id) => selectedIds.includes(id));
  const isIndeterminate = !isAllSelected && selectedIds.some((id) => allVisibleIds.includes(id));

  const toggleExpand = (id: string) => setExpandedId((prev) => (prev === id ? null : id));
  const toggleSelectAll = () => {
    if (isAllSelected) setSelectedIds((p) => p.filter((id) => !allVisibleIds.includes(id)));
    else setSelectedIds((p) => Array.from(new Set([...p, ...allVisibleIds])));
  };
  const toggleSelectOne = (id: string) =>
    setSelectedIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const clearSelection = () => setSelectedIds([]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters((p) => ({ ...p, search: searchInput || undefined, page: 1 }));
  };
  const handleDelete = (id: string) => {
    if (window.confirm('Delete this test case?')) deleteTestCase.mutate(id);
  };
  const handleBulkMove = () => {
    if (!moveSuiteId) return;
    bulkUpdate.mutate({ ids: selectedIds, action: 'move', suiteId: moveSuiteId }, {
      onSuccess: () => { setIsMoveModalOpen(false); setMoveSuiteId(''); clearSelection(); },
    });
  };
  const handleBulkStatus = (status: string) => {
    if (!status) return;
    bulkUpdate.mutate({ ids: selectedIds, action: 'setStatus', status }, {
      onSuccess: () => { setBulkStatus(''); clearSelection(); },
    });
  };
  const handleBulkDelete = () => {
    bulkUpdate.mutate({ ids: selectedIds, action: 'delete' }, {
      onSuccess: () => { setIsDeleteConfirmOpen(false); clearSelection(); },
    });
  };

  // Scenario grouping
  const hasScenarios = testCases.some((tc) => tc.scenario);
  const groupedCases = useMemo<[string, TestCase[]][]>(() => {
    if (!hasScenarios) return [];
    const map = new Map<string, TestCase[]>();
    for (const tc of testCases) {
      const key = tc.scenario ?? '';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(tc);
    }
    return Array.from(map.entries()).sort(([a], [b]) => {
      if (!a && b) return 1; if (a && !b) return -1; return a.localeCompare(b);
    });
  }, [testCases, hasScenarios]);

  const flattenSuites = (items: typeof suites, depth = 0): { value: string; label: string }[] => {
    if (!items) return [];
    return items.flatMap((s) => [
      { value: s.id, label: `${'  '.repeat(depth)}${s.name}` },
      ...flattenSuites(s.children, depth + 1),
    ]);
  };
  const suiteOptions = [{ value: '', label: 'Select a suite…' }, ...flattenSuites(suites)];
  const hasActiveFilters = !!(filters.search || filters.status || filters.priority || filters.reviewStatus || filters.scenario || filters.suiteId);

  const thCls = 'px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-gray-500 whitespace-nowrap border-r border-gray-200 last:border-r-0';

  const renderRows = (cases: TestCase[]) =>
    cases.map((tc) => {
      const isExpanded = expandedId === tc.id;
      const isSelected = selectedIds.includes(tc.id);
      const stepCount = tc._count?.steps ?? tc.steps?.length ?? 0;

      return (
        <Fragment key={tc.id}>
          <tr
            className={clsx(
              'border-b border-gray-100 group transition-colors',
              isSelected ? 'bg-primary-50/50' : isExpanded ? 'bg-gray-50' : 'hover:bg-gray-50/80',
            )}
          >
            {/* Checkbox */}
            <td className="pl-3 pr-2 py-2.5 w-9">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleSelectOne(tc.id)}
                onClick={(e) => e.stopPropagation()}
                className="h-3.5 w-3.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
            </td>

            {/* Case ID */}
            <td className="px-3 py-2.5 w-[90px] border-r border-gray-100">
              <span className="text-[11px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded whitespace-nowrap">
                {tc.caseId}
              </span>
            </td>

            {/* Title — click to expand */}
            <td className="px-3 py-2.5 border-r border-gray-100 min-w-[240px] max-w-[320px]">
              <button
                type="button"
                onClick={() => toggleExpand(tc.id)}
                className="flex items-start gap-1.5 text-left w-full group/btn"
              >
                <ChevronRightIcon className={clsx(
                  'h-3.5 w-3.5 mt-[3px] text-gray-300 shrink-0 transition-transform duration-150',
                  'group-hover/btn:text-gray-400',
                  isExpanded && 'rotate-90 text-primary-400 group-hover/btn:text-primary-500',
                )} />
                <span className="min-w-0">
                  <span className={clsx(
                    'block text-sm font-medium leading-snug transition-colors',
                    isExpanded ? 'text-primary-700' : 'text-gray-900 group-hover/btn:text-primary-600',
                  )}>
                    {tc.title}
                  </span>
                </span>
              </button>
            </td>

            {/* Suite */}
            <td className="px-3 py-2.5 border-r border-gray-100 w-[130px]">
              {tc.suite?.name
                ? <span className="text-xs text-gray-600 truncate block max-w-[118px]" title={tc.suite.name}>{tc.suite.name}</span>
                : <span className="text-gray-300 text-xs">—</span>}
            </td>

            {/* Priority */}
            <td className="px-3 py-2.5 border-r border-gray-100 w-[90px]">
              <Badge variant={tc.priority}>{tc.priority}</Badge>
            </td>

            {/* Status */}
            <td className="px-3 py-2.5 border-r border-gray-100 w-[90px]">
              <Badge variant={tc.status}>{tc.status}</Badge>
            </td>

            {/* Review */}
            <td className="px-3 py-2.5 border-r border-gray-100 w-[110px]">
              <Badge variant={tc.reviewStatus as ReviewStatus}>
                {tc.reviewStatus?.replace('_', ' ')}
              </Badge>
            </td>

            {/* Test Type */}
            <td className="px-3 py-2.5 border-r border-gray-100 w-[110px]">
              {tc.testType
                ? <Badge variant="default">{tc.testType.replace('_', ' ')}</Badge>
                : <span className="text-gray-300 text-xs">—</span>}
            </td>

            {/* Automation */}
            <td className="px-3 py-2.5 border-r border-gray-100 w-[100px]">
              <Badge variant={tc.automationStatus}>{tc.automationStatus?.replace('_', ' ')}</Badge>
            </td>

            {/* Steps count */}
            <td className="px-3 py-2.5 border-r border-gray-100 w-[70px] text-center">
              {stepCount > 0
                ? <span className="inline-flex items-center justify-center w-6 h-5 rounded text-[11px] font-semibold bg-primary-50 text-primary-600">{stepCount}</span>
                : <span className="text-gray-300 text-xs">—</span>}
            </td>

            {/* Req ID */}
            <td className="px-3 py-2.5 border-r border-gray-100 w-[100px]">
              {tc.requirementId
                ? <span className="text-[11px] font-mono bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{tc.requirementId}</span>
                : <span className="text-gray-300 text-xs">—</span>}
            </td>

            {/* Actions */}
            <td className="px-3 py-2.5 w-[70px]">
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <Link
                  href={`/projects/${projectId}/cases/${tc.id}/edit`}
                  onClick={(e) => e.stopPropagation()}
                  className="p-1.5 rounded text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                  title="Edit"
                >
                  <PencilIcon className="h-3.5 w-3.5" />
                </Link>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(tc.id); }}
                  className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  title="Delete"
                >
                  <TrashIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            </td>
          </tr>

          {/* Inline detail row */}
          {isExpanded && <DetailRow tc={tc} />}
        </Fragment>
      );
    });

  return (
    <div className="flex h-full min-h-screen">
      {/* Suite sidebar */}
      <TestSuiteTree
        projectId={projectId}
        selectedSuiteId={filters.suiteId}
        onSelectSuite={(suiteId) => setFilters((p) => ({ ...p, suiteId, page: 1 }))}
      />

      {/* Main panel */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-gray-50/40">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-white border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-base font-semibold text-gray-900">Test Cases</h1>
              {pagination && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {pagination.total} case{pagination.total !== 1 ? 's' : ''}
                  {selectedIds.length > 0 && (
                    <span className="ml-1.5 text-primary-500 font-medium">· {selectedIds.length} selected</span>
                  )}
                </p>
              )}
            </div>
          </div>
          <Link href={`/projects/${projectId}/cases/new`}>
            <Button variant="primary" size="md" leftIcon={<PlusIcon className="h-4 w-4" />}>
              New Test Case
            </Button>
          </Link>
        </div>

        {/* Filter toolbar */}
        <div className="px-6 py-2 bg-white border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <form onSubmit={handleSearch} className="relative shrink-0">
              <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch(e as unknown as React.FormEvent)}
                placeholder="Search…"
                className="pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 w-40"
              />
            </form>

            <div className="h-4 w-px bg-gray-200" />

            {/* Status pills */}
            <div className="flex items-center gap-px bg-gray-100 rounded-md p-0.5 shrink-0">
              {([
                { label: 'All', value: '' },
                { label: 'Active', value: CaseStatus.ACTIVE },
                { label: 'Draft', value: CaseStatus.DRAFT },
                { label: 'Archived', value: CaseStatus.ARCHIVED },
              ] as { label: string; value: CaseStatus | '' }[]).map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setFilters((p) => ({ ...p, status: (tab.value as CaseStatus) || undefined, page: 1 }))}
                  className={clsx(
                    'px-2.5 py-1 text-[11px] font-medium rounded transition-colors',
                    (filters.status ?? '') === tab.value
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700',
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Priority */}
            <select
              value={filters.priority ?? ''}
              onChange={(e) => setFilters((p) => ({ ...p, priority: (e.target.value as Priority) || undefined, page: 1 }))}
              className="text-[11px] border border-gray-200 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/30 text-gray-600 shrink-0"
            >
              <option value="">Priority</option>
              <option value={Priority.CRITICAL}>Critical</option>
              <option value={Priority.HIGH}>High</option>
              <option value={Priority.MEDIUM}>Medium</option>
              <option value={Priority.LOW}>Low</option>
            </select>

            {/* Review */}
            <select
              value={filters.reviewStatus ?? ''}
              onChange={(e) => setFilters((p) => ({ ...p, reviewStatus: (e.target.value as ReviewStatus) || undefined, page: 1 }))}
              className="text-[11px] border border-gray-200 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/30 text-gray-600 shrink-0"
            >
              <option value="">Review Status</option>
              <option value={ReviewStatus.DRAFT}>Draft</option>
              <option value={ReviewStatus.IN_REVIEW}>In Review</option>
              <option value={ReviewStatus.APPROVED}>Approved</option>
              <option value={ReviewStatus.REJECTED}>Rejected</option>
            </select>

            {/* Scenario */}
            {scenarios && scenarios.length > 0 && (
              <select
                value={filters.scenario ?? ''}
                onChange={(e) => setFilters((p) => ({ ...p, scenario: e.target.value || undefined, page: 1 }))}
                className="text-[11px] border border-gray-200 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/30 text-gray-600 shrink-0"
              >
                <option value="">Scenario</option>
                {scenarios.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            )}

            {hasActiveFilters && (
              <button
                onClick={() => { setFilters({ page: 1, limit: 25 }); setSearchInput(''); }}
                className="ml-auto text-[11px] text-gray-400 hover:text-gray-700 font-medium shrink-0 underline underline-offset-2"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Bulk action bar */}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2.5 px-6 py-2 bg-primary-50 border-b border-primary-200 shrink-0">
            <span className="text-xs font-semibold text-primary-700">{selectedIds.length} selected</span>
            <div className="h-3.5 w-px bg-primary-200" />
            <Button variant="secondary" size="sm" onClick={() => setIsMoveModalOpen(true)} disabled={bulkUpdate.isPending}>
              Move to Suite
            </Button>
            <select
              value={bulkStatus}
              onChange={(e) => { const v = e.target.value; if (v) { setBulkStatus(v); handleBulkStatus(v); } }}
              disabled={bulkUpdate.isPending}
              className="text-xs rounded border border-gray-200 bg-white px-2 py-1 focus:outline-none"
            >
              <option value="">Set Status…</option>
              <option value={CaseStatus.ACTIVE}>Active</option>
              <option value={CaseStatus.DRAFT}>Draft</option>
              <option value={CaseStatus.ARCHIVED}>Archived</option>
            </select>
            <Button
              variant="secondary" size="sm"
              onClick={() => setIsDeleteConfirmOpen(true)}
              disabled={bulkUpdate.isPending}
              className="!text-red-600 !border-red-200 hover:!bg-red-50"
            >
              Delete
            </Button>
            <button onClick={clearSelection} className="ml-auto text-xs text-primary-500 hover:text-primary-600 font-medium">
              Clear selection
            </button>
          </div>
        )}

        {/* Table area */}
        <div className="flex-1 overflow-auto">
          {isLoading && <div className="flex justify-center py-20"><Spinner size="lg" /></div>}
          {isError && <div className="text-center py-12 text-sm text-red-500">Failed to load test cases.</div>}
          {!isLoading && !isError && testCases.length === 0 && (
            <div className="p-8">
              <EmptyState
                title="No test cases yet"
                description="Create your first test case to get started."
                actionLabel="New Test Case"
                onAction={() => router.push(`/projects/${projectId}/cases/new`)}
              />
            </div>
          )}

          {!isLoading && !isError && testCases.length > 0 && (
            <div className="min-w-max">
              <table className="w-full border-collapse bg-white">
                {/* Sticky header */}
                <thead className="sticky top-0 z-20">
                  <tr className="bg-gray-100 border-b-2 border-gray-300">
                    {/* Select all */}
                    <th className="pl-3 pr-2 py-2.5 w-9">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        ref={(el) => { if (el) el.indeterminate = isIndeterminate; }}
                        onChange={toggleSelectAll}
                        className="h-3.5 w-3.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                    </th>
                    <th className={clsx(thCls, 'w-[90px]')}>ID</th>
                    <th className={clsx(thCls, 'min-w-[240px]')}>Title</th>
                    <th className={clsx(thCls, 'w-[130px]')}>Suite</th>
                    <th className={clsx(thCls, 'w-[90px]')}>Priority</th>
                    <th className={clsx(thCls, 'w-[90px]')}>Status</th>
                    <th className={clsx(thCls, 'w-[110px]')}>Review</th>
                    <th className={clsx(thCls, 'w-[110px]')}>Test Type</th>
                    <th className={clsx(thCls, 'w-[100px]')}>Automation</th>
                    <th className={clsx(thCls, 'w-[70px] text-center')}>Steps</th>
                    <th className={clsx(thCls, 'w-[100px]')}>Req ID</th>
                    <th className="px-3 py-2.5 w-[70px]" />
                  </tr>
                </thead>

                <tbody>
                  {hasScenarios
                    ? groupedCases.map(([scenario, cases]) => (
                        <Fragment key={`g-${scenario}`}>
                          <tr className="bg-primary-50/60 border-b border-primary-100">
                            <td colSpan={COL_COUNT} className="px-4 py-1.5">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-primary-600">
                                {scenario || 'No Scenario'}
                              </span>
                              <span className="ml-2 text-[10px] text-primary-400">
                                {cases.length} case{cases.length !== 1 ? 's' : ''}
                              </span>
                            </td>
                          </tr>
                          {renderRows(cases)}
                        </Fragment>
                      ))
                    : renderRows(testCases)
                  }
                </tbody>
              </table>

              {pagination && (
                <div className="border-t border-gray-200 bg-white">
                  <Pagination
                    pagination={pagination}
                    onPageChange={(page) => setFilters((p) => ({ ...p, page }))}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Move to Suite Modal */}
      <Modal
        isOpen={isMoveModalOpen}
        onClose={() => { setIsMoveModalOpen(false); setMoveSuiteId(''); }}
        title={`Move ${selectedIds.length} case${selectedIds.length !== 1 ? 's' : ''} to suite`}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setIsMoveModalOpen(false); setMoveSuiteId(''); }}>Cancel</Button>
            <Button variant="primary" onClick={handleBulkMove} disabled={!moveSuiteId || bulkUpdate.isPending} isLoading={bulkUpdate.isPending}>Move</Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-600">Select the destination suite.</p>
          <Select options={suiteOptions} value={moveSuiteId} onChange={(e) => setMoveSuiteId(e.target.value)} label="Target Suite" />
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        title="Delete selected cases"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsDeleteConfirmOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleBulkDelete} isLoading={bulkUpdate.isPending} className="!bg-red-600 hover:!bg-red-700">
              Delete {selectedIds.length} case{selectedIds.length !== 1 ? 's' : ''}
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-700">
          Permanently delete <span className="font-semibold">{selectedIds.length}</span> case{selectedIds.length !== 1 ? 's' : ''}? This cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
