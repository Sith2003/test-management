'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PlusIcon, TrashIcon, ArrowsUpDownIcon } from '@heroicons/react/24/outline';
import { Input } from '@/shared/components/ui/Input';
import { Select } from '@/shared/components/ui/Select';
import { Button } from '@/shared/components/ui/Button';
import { useSuites } from '@/features/test-cases/hooks/useTestCases';
import {
  Priority,
  CaseStatus,
  TestType,
  TestEnvironment,
  AutomationStatus,
  ReviewStatus,
  PlatformPortal,
  UrgencyFlag,
  Severity,
} from '@/shared/types';
import type { TestCase, CreateTestCaseInput } from '@/shared/types';

const testCaseSchema = z.object({
  // Basic
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  preconditions: z.string().optional(),
  priority: z.nativeEnum(Priority),
  status: z.nativeEnum(CaseStatus),
  suiteId: z.string().optional(),
  tags: z.string().optional(),
  steps: z
    .array(
      z.object({
        action: z.string().min(1, 'Action is required'),
        expectedResult: z.string().min(1, 'Expected result is required'),
      })
    )
    .optional(),

  // Classification
  testType: z.nativeEnum(TestType).optional().or(z.literal('')),
  testEnvironment: z.nativeEnum(TestEnvironment).optional().or(z.literal('')),
  platformPortal: z.nativeEnum(PlatformPortal).optional().or(z.literal('')),

  // QA / Workflow
  automationStatus: z.nativeEnum(AutomationStatus).optional().or(z.literal('')),
  reviewStatus: z.nativeEnum(ReviewStatus).optional().or(z.literal('')),
  urgencyFlag: z.nativeEnum(UrgencyFlag).optional().or(z.literal('')),
  scenario: z.string().optional(),
  assignedDeveloper: z.string().optional(),

  // Additional
  testData: z.string().optional(),
  expectedResult: z.string().optional(),
  severity: z.nativeEnum(Severity).optional().or(z.literal('')),
});

type TestCaseFormValues = z.infer<typeof testCaseSchema>;

interface TestCaseFormProps {
  projectId: string;
  existingCase?: TestCase;
  onSubmit: (data: CreateTestCaseInput) => void;
  isSubmitting?: boolean;
}

const textareaClass =
  'block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-colors';

export function TestCaseForm({
  projectId,
  existingCase,
  onSubmit,
  isSubmitting = false,
}: TestCaseFormProps) {
  const router = useRouter();
  const { data: suites } = useSuites(projectId);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<TestCaseFormValues>({
    resolver: zodResolver(testCaseSchema),
    defaultValues: {
      title: existingCase?.title ?? '',
      description: existingCase?.description ?? '',
      preconditions: existingCase?.preconditions ?? '',
      priority: existingCase?.priority ?? Priority.MEDIUM,
      status: existingCase?.status ?? CaseStatus.DRAFT,
      suiteId: existingCase?.suiteId ?? '',
      tags: existingCase?.tags?.join(', ') ?? '',
      steps: existingCase?.steps?.map((s) => ({
        action: s.action,
        expectedResult: s.expectedResult,
      })) ?? [],

      testType: existingCase?.testType ?? '',
      testEnvironment: existingCase?.testEnvironment ?? '',
      platformPortal: existingCase?.platformPortal ?? '',

      automationStatus: existingCase?.automationStatus ?? '',
      reviewStatus: existingCase?.reviewStatus ?? '',
      urgencyFlag: existingCase?.urgencyFlag ?? '',
      scenario: existingCase?.scenario ?? '',
      assignedDeveloper: existingCase?.assignedDeveloper ?? '',

      testData: existingCase?.testData ?? '',
      expectedResult: existingCase?.expectedResult ?? '',
      severity: existingCase?.severity ?? '',
    },
  });

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'steps',
  });

  useEffect(() => {
    if (existingCase) {
      reset({
        title: existingCase.title,
        description: existingCase.description ?? '',
        preconditions: existingCase.preconditions ?? '',
        priority: existingCase.priority,
        status: existingCase.status,
        suiteId: existingCase.suiteId ?? '',
        tags: existingCase.tags?.join(', ') ?? '',
        steps: existingCase.steps?.map((s) => ({
          action: s.action,
          expectedResult: s.expectedResult,
        })) ?? [],

        testType: existingCase.testType ?? '',
        testEnvironment: existingCase.testEnvironment ?? '',
        platformPortal: existingCase.platformPortal ?? '',

        automationStatus: existingCase.automationStatus ?? '',
        reviewStatus: existingCase.reviewStatus ?? '',
        urgencyFlag: existingCase.urgencyFlag ?? '',
        scenario: existingCase.scenario ?? '',
        assignedDeveloper: existingCase.assignedDeveloper ?? '',

        testData: existingCase.testData ?? '',
        expectedResult: existingCase.expectedResult ?? '',
        severity: existingCase.severity ?? '',
      });
    }
  }, [existingCase, reset]);

  const handleFormSubmit = (values: TestCaseFormValues) => {
    onSubmit({
      title: values.title,
      description: values.description || undefined,
      preconditions: values.preconditions || undefined,
      priority: values.priority,
      status: values.status,
      suiteId: values.suiteId || undefined,
      tags: values.tags
        ? values.tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : undefined,
      steps: values.steps,

      testType: (values.testType as TestType) || undefined,
      testEnvironment: (values.testEnvironment as TestEnvironment) || undefined,
      platformPortal: (values.platformPortal as PlatformPortal) || undefined,

      automationStatus: (values.automationStatus as AutomationStatus) || undefined,
      reviewStatus: (values.reviewStatus as ReviewStatus) || undefined,
      urgencyFlag: (values.urgencyFlag as UrgencyFlag) || undefined,
      scenario: values.scenario || undefined,
      assignedDeveloper: values.assignedDeveloper || undefined,

      testData: values.testData || undefined,
      expectedResult: values.expectedResult || undefined,
      severity: (values.severity as Severity) || undefined,
    });
  };

  const suiteOptions = [
    { value: '', label: '— No Suite —' },
    ...(suites ?? []).map((s) => ({ value: s.id, label: s.name })),
  ];

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* ── Basic Information ── */}
      <div className="bg-white rounded-xl ring-1 ring-gray-900/[0.06] p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Basic Information</h2>

        <div className="space-y-4">
          <Input
            label="Title *"
            placeholder="Test case title"
            error={errors.title?.message}
            {...register('title')}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              className={textareaClass}
              rows={3}
              placeholder="Describe what this test case verifies..."
              {...register('description')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Preconditions
            </label>
            <textarea
              className={textareaClass}
              rows={2}
              placeholder="Any preconditions required before executing..."
              {...register('preconditions')}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Priority"
              options={[
                { value: Priority.CRITICAL, label: 'Critical' },
                { value: Priority.HIGH, label: 'High' },
                { value: Priority.MEDIUM, label: 'Medium' },
                { value: Priority.LOW, label: 'Low' },
              ]}
              error={errors.priority?.message}
              {...register('priority')}
            />

            <Select
              label="Status"
              options={[
                { value: CaseStatus.DRAFT, label: 'Draft' },
                { value: CaseStatus.ACTIVE, label: 'Active' },
                { value: CaseStatus.ARCHIVED, label: 'Archived' },
              ]}
              error={errors.status?.message}
              {...register('status')}
            />

            <Select
              label="Suite"
              options={suiteOptions}
              error={errors.suiteId?.message}
              {...register('suiteId')}
            />
          </div>

          <Input
            label="Tags"
            placeholder="e.g. login, smoke, regression (comma-separated)"
            helpText="Separate multiple tags with commas"
            {...register('tags')}
          />
        </div>
      </div>

      {/* ── Classification ── */}
      <div className="bg-white rounded-xl ring-1 ring-gray-900/[0.06] p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Classification</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Test Type"
            options={[
              { value: '', label: '— Select —' },
              { value: TestType.FUNCTIONAL, label: 'Functional' },
              { value: TestType.NON_FUNCTIONAL, label: 'Non-Functional' },
              { value: TestType.INTEGRATION, label: 'Integration' },
              { value: TestType.REGRESSION, label: 'Regression' },
              { value: TestType.SMOKE, label: 'Smoke' },
              { value: TestType.UAT, label: 'UAT' },
              { value: TestType.PERFORMANCE, label: 'Performance' },
              { value: TestType.SECURITY, label: 'Security' },
            ]}
            {...register('testType')}
          />

          <Select
            label="Test Environment"
            options={[
              { value: '', label: '— Select —' },
              { value: TestEnvironment.DEV, label: 'Dev' },
              { value: TestEnvironment.STAGING, label: 'Staging' },
              { value: TestEnvironment.UAT, label: 'UAT' },
              { value: TestEnvironment.PRODUCTION, label: 'Production' },
            ]}
            {...register('testEnvironment')}
          />

          <Select
            label="Platform / Portal"
            options={[
              { value: '', label: '— Select —' },
              { value: PlatformPortal.WEB_PORTAL, label: 'Web Portal' },
              { value: PlatformPortal.MOBILE_APP, label: 'Mobile App' },
              { value: PlatformPortal.API, label: 'API' },
              { value: PlatformPortal.ADMIN_PORTAL, label: 'Admin Portal' },
            ]}
            {...register('platformPortal')}
          />
        </div>
      </div>

      {/* ── QA / Workflow ── */}
      <div className="bg-white rounded-xl ring-1 ring-gray-900/[0.06] p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">QA / Workflow</h2>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Automation Status"
              options={[
                { value: '', label: '— Select —' },
                { value: AutomationStatus.MANUAL, label: 'Manual' },
                { value: AutomationStatus.AUTOMATED, label: 'Automated' },
                { value: AutomationStatus.IN_PROGRESS, label: 'In Progress' },
              ]}
              {...register('automationStatus')}
            />

            <Select
              label="Review Status"
              options={[
                { value: '', label: '— Select —' },
                { value: ReviewStatus.DRAFT, label: 'Draft' },
                { value: ReviewStatus.READY, label: 'Ready' },
                { value: ReviewStatus.IN_REVIEW, label: 'In Review' },
                { value: ReviewStatus.APPROVED, label: 'Approved' },
              ]}
              {...register('reviewStatus')}
            />

            <Select
              label="Urgency Flag"
              options={[
                { value: '', label: '— Select —' },
                { value: UrgencyFlag.NORMAL, label: 'Normal' },
                { value: UrgencyFlag.HIGH, label: 'High' },
                { value: UrgencyFlag.CRITICAL, label: 'Critical' },
              ]}
              {...register('urgencyFlag')}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Scenario"
              placeholder="Scenario or user story reference"
              {...register('scenario')}
            />

            <Input
              label="Assigned Developer"
              placeholder="Developer name or ID"
              {...register('assignedDeveloper')}
            />
          </div>
        </div>
      </div>

      {/* ── Additional ── */}
      <div className="bg-white rounded-xl ring-1 ring-gray-900/[0.06] p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Additional</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Test Data
            </label>
            <textarea
              className={textareaClass}
              rows={3}
              placeholder="Any specific test data required for this test case..."
              {...register('testData')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expected Result
            </label>
            <textarea
              className={textareaClass}
              rows={3}
              placeholder="Overall expected outcome of this test case..."
              {...register('expectedResult')}
            />
          </div>

          <div className="max-w-xs">
            <Select
              label="Severity"
              options={[
                { value: '', label: '— Select —' },
                { value: Severity.CRITICAL, label: 'Critical' },
                { value: Severity.HIGH, label: 'High' },
                { value: Severity.MEDIUM, label: 'Medium' },
                { value: Severity.LOW, label: 'Low' },
              ]}
              {...register('severity')}
            />
          </div>
        </div>
      </div>

      {/* ── Test Steps ── */}
      <div className="bg-white rounded-xl ring-1 ring-gray-900/[0.06] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900">Test Steps</h2>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            leftIcon={<PlusIcon className="h-4 w-4" />}
            onClick={() => append({ action: '', expectedResult: '' })}
          >
            Add Step
          </Button>
        </div>

        {fields.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-8">
            No steps yet. Click &quot;Add Step&quot; to add your first step.
          </p>
        )}

        <div className="space-y-3">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="flex gap-3 p-4 bg-gray-50/60 rounded-lg ring-1 ring-gray-900/[0.06]"
            >
              <div className="flex items-center text-gray-400 text-sm font-medium w-6 shrink-0 justify-center">
                {index + 1}
              </div>

              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Action
                  </label>
                  <textarea
                    className="block w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-colors"
                    rows={2}
                    placeholder="What to do..."
                    {...register(`steps.${index}.action`)}
                  />
                  {errors.steps?.[index]?.action && (
                    <p className="text-xs text-red-600 mt-1">
                      {errors.steps[index]?.action?.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Expected Result
                  </label>
                  <textarea
                    className="block w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-colors"
                    rows={2}
                    placeholder="What should happen..."
                    {...register(`steps.${index}.expectedResult`)}
                  />
                  {errors.steps?.[index]?.expectedResult && (
                    <p className="text-xs text-red-600 mt-1">
                      {errors.steps[index]?.expectedResult?.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1 shrink-0">
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => move(index, index - 1)}
                    className="text-gray-400 hover:text-gray-600 p-1"
                    title="Move up"
                  >
                    <ArrowsUpDownIcon className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="text-gray-400 hover:text-red-600 p-1"
                  title="Remove step"
                >
                  <TrashIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push(`/projects/${projectId}/cases`)}
        >
          Cancel
        </Button>
        <Button type="submit" variant="primary" isLoading={isSubmitting}>
          {existingCase ? 'Save Changes' : 'Create Test Case'}
        </Button>
      </div>
    </form>
  );
}
