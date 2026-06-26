'use client';

import { TestPlanDetail } from '@/features/test-plans/components/TestPlanDetail';

interface PlanDetailPageProps {
  params: { projectId: string; planId: string };
}

export default function PlanDetailPage({ params }: PlanDetailPageProps) {
  return <TestPlanDetail projectId={params.projectId} planId={params.planId} />;
}
