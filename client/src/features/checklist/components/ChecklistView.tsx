'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { PlusIcon, TrashIcon, PencilIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import { PageHeader } from '@/shared/components/PageHeader';
import { Spinner } from '@/shared/components/ui/Spinner';
import {
  useTodayChecklist,
  useChecklistSession,
  useChecklistSessions,
  useUpdateChecklistEntry,
  useChecklistItems,
  useCreateChecklistItem,
  useDeleteChecklistItem,
  useCreateChecklistSession,
  useDeleteChecklistSession,
} from '@/features/checklist/hooks/useChecklist';
import { ChecklistEntryStatus, type ChecklistSession } from '@/shared/types';

interface Props { projectId: string }

const STATUS_BORDER: Record<ChecklistEntryStatus, string> = {
  [ChecklistEntryStatus.DONE]: 'border-l-green-400',
  [ChecklistEntryStatus.BLOCKED]: 'border-l-orange-400',
  [ChecklistEntryStatus.SKIPPED]: 'border-l-yellow-400',
  [ChecklistEntryStatus.PENDING]: 'border-l-gray-200',
};

// ─── Session Entry View ───────────────────────────────────────────────────────

function SessionEntryView({ projectId, session }: { projectId: string; session: ChecklistSession }) {
  const updateEntry = useUpdateChecklistEntry(projectId, session.id);
  const [localNotes, setLocalNotes] = useState<Record<string, string>>({});
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});

  const entries = session.entries ?? [];
  const total = entries.length;
  const completed = entries.filter((e) => e.status === ChecklistEntryStatus.DONE).length;
  const progressPct = total > 0 ? Math.round((completed / total) * 100) : 0;

  const dateLabel = new Date(session.date).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  function handleStatusClick(entryId: string, status: ChecklistEntryStatus, current: ChecklistEntryStatus) {
    const next = status === current ? ChecklistEntryStatus.PENDING : status;
    updateEntry.mutate({ entryId, status: next, notes: localNotes[entryId] });
  }

  function handleNotesBlur(entryId: string, current: ChecklistEntryStatus) {
    updateEntry.mutate({ entryId, status: current, notes: localNotes[entryId] });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-gray-500">{dateLabel}</p>

      <div className="bg-white rounded-xl ring-1 ring-gray-900/[0.06] p-6">
        <div className="mb-5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">{completed}</span> of{' '}
              <span className="font-semibold text-gray-900">{total}</span> completed
            </span>
            <span className="text-xs font-medium text-primary-600">{progressPct}%</span>
          </div>
          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-primary-500 rounded-full transition-all duration-300" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        {entries.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">No checklist items configured for this project.</p>
        ) : (
          <ul className="space-y-2">
            {entries.map((entry) => {
              const isExpanded = expandedNotes[entry.id] ?? false;
              const noteValue = localNotes[entry.id] ?? entry.notes ?? '';
              return (
                <li
                  key={entry.id}
                  className={clsx(
                    'flex flex-col border-l-4 pl-4 pr-3 py-3 rounded-r-lg bg-gray-50 transition-colors',
                    STATUS_BORDER[entry.status],
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className={clsx('flex-shrink-0 h-5 w-5 rounded-full flex items-center justify-center', entry.status === ChecklistEntryStatus.DONE ? 'bg-green-100' : 'bg-gray-100')}>
                      {entry.status === ChecklistEntryStatus.DONE ? (
                        <svg className="h-3 w-3 text-green-600" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        <span className="h-2 w-2 rounded-full bg-gray-300" />
                      )}
                    </span>

                    <span className={clsx('flex-1 text-sm font-medium', entry.status === ChecklistEntryStatus.DONE ? 'text-gray-400 line-through' : 'text-gray-800')}>
                      {entry.item.title}
                    </span>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {([
                        { s: ChecklistEntryStatus.DONE, label: 'Done', active: 'bg-green-500 text-white border-green-500', inactive: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200' },
                        { s: ChecklistEntryStatus.SKIPPED, label: 'Skip', active: 'bg-yellow-500 text-white border-yellow-500', inactive: 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200' },
                        { s: ChecklistEntryStatus.BLOCKED, label: 'Block', active: 'bg-orange-500 text-white border-orange-500', inactive: 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200' },
                      ] as const).map(({ s, label, active, inactive }) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => handleStatusClick(entry.id, s, entry.status)}
                          className={clsx('px-2.5 py-1 rounded text-xs font-medium border transition-all', entry.status === s ? active : inactive)}
                        >
                          {label}
                        </button>
                      ))}

                      <button
                        type="button"
                        title="Toggle notes"
                        onClick={() => setExpandedNotes((prev) => ({ ...prev, [entry.id]: !prev[entry.id] }))}
                        className={clsx('p-1 rounded transition-colors', isExpanded ? 'text-primary-600 bg-primary-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100')}
                      >
                        <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none">
                          <path d="M2 4h12M2 8h8M2 12h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-2 ml-8">
                      <textarea
                        rows={1}
                        placeholder="Add notes…"
                        value={noteValue}
                        onChange={(e) => setLocalNotes((prev) => ({ ...prev, [entry.id]: e.target.value }))}
                        onBlur={() => handleNotesBlur(entry.id, entry.status)}
                        className="w-full resize-y text-xs text-gray-700 placeholder-gray-400 bg-white rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-colors"
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

// ─── Today section (loads & auto-creates today) ───────────────────────────────

function TodaySection({ projectId }: { projectId: string }) {
  const { data: session, isLoading } = useTodayChecklist(projectId);
  if (isLoading) return <div className="flex justify-center py-12"><Spinner size="md" /></div>;
  if (!session) return <p className="text-sm text-gray-400 py-8 text-center">Could not load today&apos;s checklist.</p>;
  return <SessionEntryView projectId={projectId} session={session} />;
}

// ─── Selected past session ────────────────────────────────────────────────────

function PastSessionSection({ projectId, sessionId }: { projectId: string; sessionId: string }) {
  const { data: session, isLoading } = useChecklistSession(projectId, sessionId);
  if (isLoading) return <div className="flex justify-center py-12"><Spinner size="md" /></div>;
  if (!session) return <p className="text-sm text-gray-400 py-8 text-center">Session not found.</p>;
  return <SessionEntryView projectId={projectId} session={session} />;
}

// ─── Template items manager ───────────────────────────────────────────────────

function ItemsManager({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const { data: items = [], isLoading } = useChecklistItems(projectId);
  const createItem = useCreateChecklistItem(projectId);
  const deleteItem = useDeleteChecklistItem(projectId);
  const [newTitle, setNewTitle] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    createItem.mutate(newTitle.trim(), { onSuccess: () => setNewTitle('') });
  };

  return (
    <div className="bg-white rounded-xl ring-1 ring-gray-900/[0.06] p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">Manage Checklist Items</h2>
        <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors">
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>

      {isLoading ? (
        <Spinner size="sm" />
      ) : (
        <ul className="space-y-1.5">
          {items.filter((i) => i.isActive).map((item) => (
            <li key={item.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50 group">
              <span className="flex-1 text-sm text-gray-800">{item.title}</span>
              <button
                onClick={() => deleteItem.mutate(item.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-300 hover:text-red-500 rounded"
              >
                <TrashIcon className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
          {items.filter((i) => i.isActive).length === 0 && (
            <p className="text-xs text-gray-400 py-2 text-center">No items yet.</p>
          )}
        </ul>
      )}

      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="New checklist item…"
          className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400"
        />
        <button
          type="submit"
          disabled={!newTitle.trim() || createItem.isPending}
          className="px-3 py-2 bg-primary-500 text-white text-xs font-medium rounded-lg hover:bg-primary-600 disabled:opacity-50 transition-colors"
        >
          Add
        </button>
      </form>
    </div>
  );
}

// ─── History sidebar ──────────────────────────────────────────────────────────

function HistorySidebar({
  projectId,
  selectedSessionId,
  onSelect,
  onSelectToday,
}: {
  projectId: string;
  selectedSessionId: string | null;
  onSelect: (session: ChecklistSession) => void;
  onSelectToday: () => void;
}) {
  const { data: sessions, isLoading } = useChecklistSessions(projectId);
  const createSession = useCreateChecklistSession(projectId);
  const deleteSession = useDeleteChecklistSession(projectId);
  const [createDate, setCreateDate] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const todayStr = new Date().toISOString().slice(0, 10);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createDate) return;
    createSession.mutate(createDate, {
      onSuccess: (session) => {
        setShowCreate(false);
        setCreateDate('');
        // If it's today, go to today view; otherwise select the new session
        const sessionDate = new Date(session.date).toISOString().slice(0, 10);
        if (sessionDate === todayStr) onSelectToday();
        else onSelect(session);
      },
    });
  };

  const handleDelete = (sessionId: string) => {
    deleteSession.mutate(sessionId, {
      onSuccess: () => {
        setDeleteConfirm(null);
        if (selectedSessionId === sessionId) onSelectToday();
      },
    });
  };

  return (
    <div className="bg-white rounded-xl ring-1 ring-gray-900/[0.06] p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900">Sessions</h2>
        <button
          onClick={() => setShowCreate((p) => !p)}
          className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium transition-colors"
        >
          <PlusIcon className="h-3.5 w-3.5" />
          New Day
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="flex gap-2">
          <input
            type="date"
            value={createDate}
            onChange={(e) => setCreateDate(e.target.value)}
            className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400"
          />
          <button
            type="submit"
            disabled={!createDate || createSession.isPending}
            className="px-2.5 py-1.5 bg-primary-500 text-white text-xs rounded-lg hover:bg-primary-600 disabled:opacity-50 transition-colors"
          >
            Create
          </button>
        </form>
      )}

      {/* Today shortcut */}
      <button
        onClick={onSelectToday}
        className={clsx(
          'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors',
          selectedSessionId === null ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-50',
        )}
      >
        <span>Today</span>
        <span className="text-[11px] text-gray-400">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
      </button>

      {isLoading ? (
        <Spinner size="sm" />
      ) : !sessions || sessions.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-2">No past sessions.</p>
      ) : (
        <ul className="space-y-0.5 max-h-80 overflow-y-auto">
          {sessions
            .filter((s) => new Date(s.date).toISOString().slice(0, 10) !== todayStr)
            .map((s) => {
              const dateLabel = new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
              const doneCount = s._count?.entries ?? 0;
              const isSelected = selectedSessionId === s.id;

              return (
                <li key={s.id} className="group">
                  {deleteConfirm === s.id ? (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50">
                      <span className="flex-1 text-xs text-red-700">Delete this session?</span>
                      <button onClick={() => handleDelete(s.id)} className="text-xs text-red-600 font-medium hover:text-red-800">Yes</button>
                      <button onClick={() => setDeleteConfirm(null)} className="text-xs text-gray-500 hover:text-gray-700">No</button>
                    </div>
                  ) : (
                    <div className={clsx('flex items-center gap-2 px-3 py-2 rounded-lg transition-colors cursor-pointer', isSelected ? 'bg-primary-50 text-primary-700' : 'hover:bg-gray-50 text-gray-700')}>
                      <button className="flex-1 flex items-center justify-between text-left" onClick={() => onSelect(s)}>
                        <span className="text-sm font-medium">{dateLabel}</span>
                        <span className="text-[11px] text-gray-400 tabular-nums">{doneCount} done</span>
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(s.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-gray-300 hover:text-red-500 rounded shrink-0"
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
        </ul>
      )}
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export function ChecklistView({ projectId }: Props) {
  // null = today's session; string = specific past session id
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [showItemsManager, setShowItemsManager] = useState(false);

  return (
    <div>
      <PageHeader
        title="Daily QA Checklist"
        description="Track daily quality gate checks"
        actions={
          <button
            onClick={() => setShowItemsManager((p) => !p)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
          >
            <PencilIcon className="h-4 w-4" />
            Manage Items
          </button>
        }
      />
      <div className="px-8 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-6 items-start">
          <div className="space-y-4">
            {showItemsManager && (
              <ItemsManager projectId={projectId} onClose={() => setShowItemsManager(false)} />
            )}
            {selectedSessionId === null ? (
              <TodaySection projectId={projectId} />
            ) : (
              <PastSessionSection projectId={projectId} sessionId={selectedSessionId} />
            )}
          </div>
          <HistorySidebar
            projectId={projectId}
            selectedSessionId={selectedSessionId}
            onSelect={(s) => setSelectedSessionId(s.id)}
            onSelectToday={() => setSelectedSessionId(null)}
          />
        </div>
      </div>
    </div>
  );
}
