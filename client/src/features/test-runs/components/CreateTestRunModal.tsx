'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/shared/components/ui/Modal';
import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';
import { Spinner } from '@/shared/components/ui/Spinner';
import { Badge } from '@/shared/components/ui/Badge';
import { useTestCases } from '@/features/test-cases/hooks/useTestCases';
import { useCreateTestRun } from '@/features/test-runs/hooks/useTestRuns';
import type { TestCase } from '@/shared/types';
import { type Priority } from '@/shared/types';

const createRunSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().optional(),
  sprint: z.string().optional(),
  version: z.string().optional(),
});

type CreateRunFormValues = z.infer<typeof createRunSchema>;

interface CreateTestRunModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function CreateTestRunModal({
  projectId,
  isOpen,
  onClose,
}: CreateTestRunModalProps) {
  const [selectedCaseIds, setSelectedCaseIds] = useState<Set<string>>(new Set());
  const { data: testCasesData, isLoading: casesLoading } = useTestCases(projectId, {
    limit: 100,
    status: undefined,
  });
  const createRun = useCreateTestRun(projectId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateRunFormValues>({
    resolver: zodResolver(createRunSchema),
  });

  const testCases = testCasesData?.data ?? [];

  const toggleCase = (id: string) => {
    setSelectedCaseIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedCaseIds.size === testCases.length) {
      setSelectedCaseIds(new Set());
    } else {
      setSelectedCaseIds(new Set(testCases.map((tc) => tc.id)));
    }
  };

  const onSubmit = (data: CreateRunFormValues) => {
    createRun.mutate(
      {
        name: data.name,
        description: data.description || undefined,
        sprint: data.sprint || undefined,
        version: data.version || undefined,
        testCaseIds: Array.from(selectedCaseIds),
      },
      {
        onSuccess: () => {
          reset();
          setSelectedCaseIds(new Set());
          onClose();
        },
      }
    );
  };

  const handleClose = () => {
    reset();
    setSelectedCaseIds(new Set());
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Test Run"
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit(onSubmit)}
            isLoading={createRun.isPending}
            disabled={selectedCaseIds.size === 0}
          >
            Create Run ({selectedCaseIds.size} cases)
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          label="Run Name *"
          placeholder="Sprint 23 Regression"
          error={errors.name?.message}
          {...register('name')}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            className="block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-colors"
            rows={2}
            placeholder="Optional description..."
            {...register('description')}
          />
        </div>

        {/* Sprint and Version */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Sprint"
            placeholder="e.g. Sprint 5"
            {...register('sprint')}
          />
          <Input
            label="Version"
            placeholder="e.g. v1.2.3"
            {...register('version')}
          />
        </div>

        {/* Test case selection */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">
              Select Test Cases *
            </label>
            <button
              type="button"
              onClick={toggleAll}
              className="text-xs text-primary-600 hover:text-primary-700"
            >
              {selectedCaseIds.size === testCases.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          {casesLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto ring-1 ring-gray-900/[0.06] rounded-lg divide-y divide-gray-100">
              {testCases.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-6">
                  No test cases found. Create test cases first.
                </p>
              ) : (
                testCases.map((tc: TestCase) => (
                  <label
                    key={tc.id}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCaseIds.has(tc.id)}
                      onChange={() => toggleCase(tc.id)}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="flex-1 text-sm text-gray-900">{tc.title}</span>
                    <Badge variant={tc.priority as Priority}>
                      {tc.priority}
                    </Badge>
                  </label>
                ))
              )}
            </div>
          )}
          {selectedCaseIds.size === 0 && (
            <p className="mt-1 text-xs text-red-600">Select at least one test case</p>
          )}
        </div>
      </div>
    </Modal>
  );
}
