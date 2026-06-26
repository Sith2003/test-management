'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { PageHeader } from '@/shared/components/PageHeader';
import { TestCaseForm } from '@/features/test-cases/components/TestCaseForm';
import { Spinner } from '@/shared/components/ui/Spinner';
import { DefectHistorySection } from '@/features/defects/components/DefectHistorySection';
import { ReviewWorkflowSection } from '@/features/test-cases/components/ReviewWorkflowSection';
import { ActivityFeed } from '@/features/activity/components/ActivityFeed';
import { TestCaseComments } from '@/features/test-cases/components/TestCaseComments';
import {
  useTestCase,
  useUpdateTestCase,
} from '@/features/test-cases/hooks/useTestCases';
import type { UpdateTestCaseInput } from '@/shared/types';

interface EditCasePageProps {
  params: { projectId: string; caseId: string };
}

export default function EditCasePage({ params }: EditCasePageProps) {
  const { projectId, caseId } = params;
  const router = useRouter();
  const { data: testCase, isLoading } = useTestCase(projectId, caseId);
  const updateTestCase = useUpdateTestCase(projectId, caseId);

  const handleSubmit = (data: UpdateTestCaseInput) => {
    updateTestCase.mutate(data, {
      onSuccess: () => {
        router.push(`/projects/${projectId}/cases`);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!testCase) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Test case not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-full flex flex-col">
      <PageHeader
        title="Edit Test Case"
        description={testCase.title}
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
      <div className="px-8 py-6 flex-1 grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6 items-start">
        <TestCaseForm
          projectId={projectId}
          existingCase={testCase}
          onSubmit={handleSubmit}
          isSubmitting={updateTestCase.isPending}
        />
        <div className="space-y-4">
          <ReviewWorkflowSection projectId={projectId} testCase={testCase} />
          <DefectHistorySection projectId={projectId} testCaseId={caseId} />
          <div className="bg-white rounded-xl ring-1 ring-gray-900/[0.06] p-5">
            <TestCaseComments projectId={projectId} caseId={caseId} />
          </div>
          <div className="bg-white rounded-xl ring-1 ring-gray-900/[0.06] p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Activity</h3>
            <ActivityFeed projectId={projectId} entityType="TEST_CASE" limit={20} />
          </div>
        </div>
      </div>
    </div>
  );
}
