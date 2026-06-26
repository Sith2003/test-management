'use client';

import { UploadForm } from '@/features/upload/components/UploadForm';

interface UploadPageProps {
  params: { projectId: string };
}

export default function UploadPage({ params }: UploadPageProps) {
  return <UploadForm projectId={params.projectId} />;
}
