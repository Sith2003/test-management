'use client';

import { useState } from 'react';
import { PageHeader } from '@/shared/components/PageHeader';
import { Button } from '@/shared/components/ui/Button';
import { TestPlanList } from '@/features/test-plans/components/TestPlanList';
import { CreateTestPlanModal } from '@/features/test-plans/components/CreateTestPlanModal';

interface PlansPageProps {
  params: { projectId: string };
}

export default function PlansPage({ params }: PlansPageProps) {
  const { projectId } = params;
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div>
      <PageHeader
        title="Test Plans"
        description="Organize test runs by sprint or release"
        actions={
          <Button variant="primary" size="md" onClick={() => setIsModalOpen(true)}>
            New Test Plan
          </Button>
        }
      />
      <div className="px-8 py-6">
        <TestPlanList projectId={projectId} onCreateClick={() => setIsModalOpen(true)} />
      </div>
      <CreateTestPlanModal
        projectId={projectId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
