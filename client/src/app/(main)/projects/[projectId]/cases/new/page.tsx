'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { PageHeader } from '@/shared/components/PageHeader';
import { TestCaseForm } from '@/features/test-cases/components/TestCaseForm';
import { useCreateTestCase } from '@/features/test-cases/hooks/useTestCases';
import type { CreateTestCaseInput } from '@/shared/types';

interface NewCasePageProps {
  params: { projectId: string };
}

export default function NewCasePage({ params }: NewCasePageProps) {
  const { projectId } = params;
  const router = useRouter();
  const createTestCase = useCreateTestCase(projectId);

  const handleSubmit = (data: CreateTestCaseInput) => {
    createTestCase.mutate(data, {
      onSuccess: () => {
        router.push(`/projects/${projectId}/cases`);
      },
    });
  };

  return (
    <div className="min-h-full flex flex-col">
      <PageHeader
        title="New Test Case"
        description="Create a new test case for this project"
        actions={
          <Link
            href={`/projects/${projectId}/cases`}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Cases
          </Link>
        }
      />
      <div className="px-8 py-6 flex-1">
        <TestCaseForm
          projectId={projectId}
          onSubmit={handleSubmit}
          isSubmitting={createTestCase.isPending}
        />
      </div>
    </div>
  );
}
