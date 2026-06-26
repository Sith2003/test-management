'use client';

import { AdhocList } from '@/features/adhoc/components/AdhocList';

interface Props {
  params: { projectId: string };
}

export default function AdhocPage({ params }: Props) {
  return <AdhocList projectId={params.projectId} />;
}
