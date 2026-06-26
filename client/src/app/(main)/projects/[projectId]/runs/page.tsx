'use client';

import { TestRunList } from '@/features/test-runs/components/TestRunList';

interface RunsPageProps {
  params: { projectId: string };
}

export default function RunsPage({ params }: RunsPageProps) {
  return <TestRunList projectId={params.projectId} />;
}
