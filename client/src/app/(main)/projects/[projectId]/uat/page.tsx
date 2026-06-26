'use client';

import { UatSessionList } from '@/features/uat/components/UatSessionList';

interface Props {
  params: { projectId: string };
}

export default function UatPage({ params }: Props) {
  return <UatSessionList projectId={params.projectId} />;
}
