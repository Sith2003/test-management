'use client';

import { useState } from 'react';
import clsx from 'clsx';
import {
  FolderIcon,
  FolderOpenIcon,
  ChevronRightIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Spinner } from '@/shared/components/ui/Spinner';
import { useSuites, useCreateSuite, useReorderSuites, useDeleteSuite } from '@/features/test-cases/hooks/useTestCases';
import type { TestSuite } from '@/shared/types';

interface TestSuiteTreeProps {
  projectId: string;
  selectedSuiteId?: string;
  onSelectSuite: (suiteId: string | undefined) => void;
}

interface SuiteNodeProps {
  suite: TestSuite;
  selectedSuiteId?: string;
  onSelectSuite: (suiteId: string | undefined) => void;
  onDelete: (suiteId: string, suiteName: string) => void;
  depth?: number;
  /** When true, this node participates in DnD and shows a drag handle */
  draggable?: boolean;
}

interface SortableSuiteItemProps {
  suite: TestSuite;
  children: React.ReactNode;
}

function SortableSuiteItem({ suite, children }: SortableSuiteItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: suite.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li ref={setNodeRef} style={style}>
      <div className="flex items-center">
        {/* Drag handle */}
        <span
          {...attributes}
          {...listeners}
          className="cursor-grab p-1 text-gray-300 hover:text-gray-500 shrink-0 touch-none"
          title="Drag to reorder"
          aria-label="Drag handle"
        >
          ⠿
        </span>
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </li>
  );
}

function SuiteNode({
  suite,
  selectedSuiteId,
  onSelectSuite,
  onDelete,
  depth = 0,
  draggable = false,
}: SuiteNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = suite.children && suite.children.length > 0;

  const buttonContent = (
    <div className="group/node flex items-center">
      <button
        onClick={() => onSelectSuite(suite.id)}
        className={clsx(
          'flex-1 flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors text-left min-w-0',
          selectedSuiteId === suite.id
            ? 'bg-primary-50 text-primary-700 font-medium'
            : 'text-gray-600 hover:bg-gray-100'
        )}
        style={{ paddingLeft: draggable ? `${depth * 16}px` : `${8 + depth * 16}px` }}
      >
        {hasChildren ? (
          <span
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <ChevronRightIcon
              className={clsx('h-3.5 w-3.5 transition-transform', isExpanded && 'rotate-90')}
            />
          </span>
        ) : (
          <span className="w-3.5" />
        )}
        {isExpanded && hasChildren ? (
          <FolderOpenIcon className="h-4 w-4 text-yellow-500 shrink-0" />
        ) : (
          <FolderIcon className="h-4 w-4 text-yellow-500 shrink-0" />
        )}
        <span className="truncate">{suite.name}</span>
        {suite._count?.testCases != null && (
          <span className="ml-auto text-xs text-gray-400 shrink-0 mr-1">
            {suite._count.testCases}
          </span>
        )}
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(suite.id, suite.name);
        }}
        className="opacity-0 group-hover/node:opacity-100 p-1 mr-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all shrink-0"
        title="Delete suite"
      >
        <TrashIcon className="h-3.5 w-3.5" />
      </button>
    </div>
  );

  const childrenList = isExpanded && hasChildren ? (
    <ul>
      {suite.children!.map((child) => (
        <SuiteNode
          key={child.id}
          suite={child}
          selectedSuiteId={selectedSuiteId}
          onSelectSuite={onSelectSuite}
          onDelete={onDelete}
          depth={depth + 1}
        />
      ))}
    </ul>
  ) : null;

  if (draggable) {
    return (
      <SortableSuiteItem suite={suite}>
        {buttonContent}
        {childrenList}
      </SortableSuiteItem>
    );
  }

  return (
    <li>
      {buttonContent}
      {childrenList}
    </li>
  );
}

export function TestSuiteTree({
  projectId,
  selectedSuiteId,
  onSelectSuite,
}: TestSuiteTreeProps) {
  const { data: suites, isLoading } = useSuites(projectId);
  const createSuite = useCreateSuite(projectId);
  const deleteSuite = useDeleteSuite(projectId);
  const reorderSuites = useReorderSuites(projectId);
  const [isAdding, setIsAdding] = useState(false);
  const [newSuiteName, setNewSuiteName] = useState('');

  const handleDeleteSuite = (suiteId: string, suiteName: string) => {
    if (window.confirm(`Delete suite "${suiteName}"? All test cases inside will also be permanently deleted.`)) {
      deleteSuite.mutate(suiteId);
    }
  };

  // Local ordered list of top-level suites for optimistic reordering
  const [localOrder, setLocalOrder] = useState<string[] | null>(null);

  const topLevelSuites = suites ?? [];
  // Use localOrder when set (during/after drag), otherwise use server order
  const orderedSuites = localOrder
    ? topLevelSuites
        .slice()
        .sort((a, b) => localOrder.indexOf(a.id) - localOrder.indexOf(b.id))
    : topLevelSuites;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = orderedSuites.findIndex((s) => s.id === active.id);
    const newIndex = orderedSuites.findIndex((s) => s.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(orderedSuites, oldIndex, newIndex);
    const newOrder = reordered.map((s) => s.id);
    setLocalOrder(newOrder);

    const orders = reordered.map((suite, index) => ({
      suiteId: suite.id,
      order: index,
    }));

    reorderSuites.mutate(orders, {
      onSuccess: () => {
        // Server is now the source of truth; clear local override
        setLocalOrder(null);
      },
      onError: () => {
        // Revert to server order on failure
        setLocalOrder(null);
      },
    });
  };

  const handleAddSuite = () => {
    if (newSuiteName.trim()) {
      createSuite.mutate(
        { name: newSuiteName.trim() },
        {
          onSuccess: () => {
            setNewSuiteName('');
            setIsAdding(false);
          },
        }
      );
    }
  };

  return (
    <div className="w-60 shrink-0 bg-white border-r border-gray-100 flex flex-col">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Suites</h3>
        <button
          onClick={() => setIsAdding(true)}
          className="text-gray-400 hover:text-primary-600 transition-colors"
          title="Add suite"
        >
          <PlusIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {/* All cases option */}
        <button
          onClick={() => onSelectSuite(undefined)}
          className={clsx(
            'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors text-left mb-1',
            !selectedSuiteId
              ? 'bg-primary-50 text-primary-700 font-medium'
              : 'text-gray-600 hover:bg-gray-100'
          )}
        >
          <FolderIcon className="h-4 w-4 text-gray-400" />
          All Cases
        </button>

        {isLoading && (
          <div className="flex justify-center py-4">
            <Spinner size="sm" />
          </div>
        )}

        {orderedSuites.length > 0 && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={orderedSuites.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <ul className="space-y-0.5">
                {orderedSuites.map((suite) => (
                  <SuiteNode
                    key={suite.id}
                    suite={suite}
                    selectedSuiteId={selectedSuiteId}
                    onSelectSuite={onSelectSuite}
                    onDelete={handleDeleteSuite}
                    draggable
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}

        {isAdding && (
          <div className="mt-2 px-2">
            <input
              autoFocus
              type="text"
              value={newSuiteName}
              onChange={(e) => setNewSuiteName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddSuite();
                if (e.key === 'Escape') {
                  setIsAdding(false);
                  setNewSuiteName('');
                }
              }}
              placeholder="Suite name..."
              className="block w-full rounded-lg border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400"
            />
            <div className="flex gap-2 mt-1">
              <button
                onClick={handleAddSuite}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setIsAdding(false);
                  setNewSuiteName('');
                }}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
