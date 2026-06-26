'use client';

import { DefectDetail } from '@/features/defects/components/DefectDetail';

interface Props {
  params: { projectId: string; defectId: string };
}

export default function DefectDetailPage({ params }: Props) {
  return <DefectDetail projectId={params.projectId} defectId={params.defectId} />;
}
