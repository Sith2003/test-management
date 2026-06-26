'use client';

import { TestCaseList } from '@/features/test-cases/components/TestCaseList';

interface CasesPageProps {
  params: { projectId: string };
}

export default function CasesPage({ params }: CasesPageProps) {
  return <TestCaseList projectId={params.projectId} />;
}
