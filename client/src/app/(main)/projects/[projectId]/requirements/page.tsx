'use client';

import { useState } from 'react';
import { RequirementList } from '@/features/requirements/components/RequirementList';
import { TraceabilityMatrix } from '@/features/requirements/components/TraceabilityMatrix';

interface Props {
  params: { projectId: string };
}

type Tab = 'requirements' | 'traceability';

export default function RequirementsPage({ params }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('requirements');
  const { projectId } = params;

  return (
    <div>
      {/* Tab bar */}
      <div className="border-b border-gray-100 bg-white px-8">
        <nav className="flex gap-1 -mb-px">
          {([
            { id: 'requirements', label: 'Requirements' },
            { id: 'traceability', label: 'Traceability Matrix' },
          ] as { id: Tab; label: string }[]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={[
                'px-4 py-3.5 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              ].join(' ')}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'requirements' && <RequirementList projectId={projectId} />}
      {activeTab === 'traceability' && (
        <div className="px-8 py-6">
          <TraceabilityMatrix projectId={projectId} />
        </div>
      )}
    </div>
  );
}
