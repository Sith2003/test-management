'use client';

import { useState } from 'react';
import { Modal } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';
import { useCreateDefect } from '@/features/defects/hooks/useDefects';
import { Severity, Priority } from '@/shared/types';
import type { CreateDefectInput } from '@/shared/types';

interface CreateDefectModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  initialValues?: Partial<CreateDefectInput> & { testResultId?: string };
}

const inputClass =
  'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400';

const textareaClass =
  'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 resize-none';

const labelClass = 'block text-xs font-medium text-gray-700 mb-1';

const defaultForm: CreateDefectInput = {
  title: '',
  module: '',
  severity: Severity.MEDIUM,
  priority: Priority.MEDIUM,
  description: '',
  stepsToReproduce: '',
  expectedResult: '',
  actualResult: '',
  testCaseId: '',
  bugPattern: '',
};

export function CreateDefectModal({ projectId, isOpen, onClose, initialValues }: CreateDefectModalProps) {
  const createDefect = useCreateDefect(projectId);
  const [form, setForm] = useState<CreateDefectInput>(() => ({ ...defaultForm, ...initialValues }));

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleClose = () => {
    setForm({ ...defaultForm, ...initialValues });
    onClose();
  };

  const handleSubmit = () => {
    if (!form.title.trim()) return;

    const payload: CreateDefectInput & { testResultId?: string } = {
      title: form.title.trim(),
      ...(form.module?.trim() && { module: form.module.trim() }),
      severity: form.severity,
      priority: form.priority,
      ...(form.description?.trim() && { description: form.description.trim() }),
      ...(form.stepsToReproduce?.trim() && { stepsToReproduce: form.stepsToReproduce.trim() }),
      ...(form.expectedResult?.trim() && { expectedResult: form.expectedResult.trim() }),
      ...(form.actualResult?.trim() && { actualResult: form.actualResult.trim() }),
      ...(form.testCaseId?.trim() && { testCaseId: form.testCaseId.trim() }),
      ...(form.bugPattern?.trim() && { bugPattern: form.bugPattern.trim() }),
      ...(initialValues?.testResultId && { testResultId: initialValues.testResultId }),
    };

    createDefect.mutate(payload, {
      onSuccess: () => {
        setForm(defaultForm);
        onClose();
      },
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Log New Defect"
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={createDefect.isPending}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={createDefect.isPending}
            disabled={!form.title.trim()}
          >
            Log Defect
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Title */}
        <div>
          <label className={labelClass}>
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Brief description of the defect"
            className={inputClass}
          />
        </div>

        {/* Module */}
        <div>
          <label className={labelClass}>Module</label>
          <input
            type="text"
            name="module"
            value={form.module ?? ''}
            onChange={handleChange}
            placeholder="e.g. Authentication, Dashboard"
            className={inputClass}
          />
        </div>

        {/* Severity + Priority */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Severity</label>
            <select
              name="severity"
              value={form.severity}
              onChange={handleChange}
              className={inputClass}
            >
              {Object.values(Severity).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Priority</label>
            <select
              name="priority"
              value={form.priority}
              onChange={handleChange}
              className={inputClass}
            >
              {Object.values(Priority).map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className={labelClass}>Description</label>
          <textarea
            name="description"
            value={form.description ?? ''}
            onChange={handleChange}
            rows={3}
            placeholder="Describe the defect in detail..."
            className={textareaClass}
          />
        </div>

        {/* Steps to Reproduce */}
        <div>
          <label className={labelClass}>Steps to Reproduce</label>
          <textarea
            name="stepsToReproduce"
            value={form.stepsToReproduce ?? ''}
            onChange={handleChange}
            rows={3}
            placeholder="1. Navigate to...&#10;2. Click on...&#10;3. Observe..."
            className={textareaClass}
          />
        </div>

        {/* Expected Result */}
        <div>
          <label className={labelClass}>Expected Result</label>
          <textarea
            name="expectedResult"
            value={form.expectedResult ?? ''}
            onChange={handleChange}
            rows={2}
            placeholder="What should happen..."
            className={textareaClass}
          />
        </div>

        {/* Actual Result */}
        <div>
          <label className={labelClass}>Actual Result</label>
          <textarea
            name="actualResult"
            value={form.actualResult ?? ''}
            onChange={handleChange}
            rows={2}
            placeholder="What actually happened..."
            className={textareaClass}
          />
        </div>

        {/* Linked Test Case ID + Bug Pattern */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Linked Test Case ID</label>
            <input
              type="text"
              name="testCaseId"
              value={form.testCaseId ?? ''}
              onChange={handleChange}
              placeholder="e.g. TC-001"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Bug Pattern</label>
            <input
              type="text"
              name="bugPattern"
              value={form.bugPattern ?? ''}
              onChange={handleChange}
              placeholder="e.g. Null pointer, Race condition"
              className={inputClass}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}
