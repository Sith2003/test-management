'use client';

import { ChecklistView } from '@/features/checklist/components/ChecklistView';

interface Props {
  params: { projectId: string };
}

export default function ChecklistPage({ params }: Props) {
  return <ChecklistView projectId={params.projectId} />;
}
