'use client';

import { DefectList } from '@/features/defects/components/DefectList';

interface Props {
  params: { projectId: string };
}

export default function DefectsPage({ params }: Props) {
  return <DefectList projectId={params.projectId} />;
}
