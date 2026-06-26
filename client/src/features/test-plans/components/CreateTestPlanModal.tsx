'use client';

import { useState } from 'react';
import { Modal } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';
import { useCreatePlan } from '@/features/test-plans/hooks/usePlans';
import type { CreateTestPlanInput } from '@/shared/types';

interface CreateTestPlanModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

const inputClass =
  'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400';
const labelClass = 'block text-xs font-medium text-gray-700 mb-1';

export function CreateTestPlanModal({ projectId, isOpen, onClose }: CreateTestPlanModalProps) {
  const createPlan = useCreatePlan(projectId);
  const [form, setForm] = useState<CreateTestPlanInput>({ name: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleClose = () => {
    setForm({ name: '' });
    onClose();
  };

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    createPlan.mutate(
      {
        name: form.name.trim(),
        ...(form.description?.trim() && { description: form.description.trim() }),
        ...(form.sprint?.trim() && { sprint: form.sprint.trim() }),
        ...(form.version?.trim() && { version: form.version.trim() }),
        ...(form.targetDate && { targetDate: form.targetDate }),
      },
      { onSuccess: handleClose }
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="New Test Plan"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={createPlan.isPending}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={createPlan.isPending}
            disabled={!form.name.trim()}
          >
            Create Plan
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className={labelClass}>
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="e.g. Sprint 5 Test Plan"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Description</label>
          <textarea
            name="description"
            value={form.description ?? ''}
            onChange={handleChange}
            rows={2}
            placeholder="Scope, goals, or notes..."
            className={`${inputClass} resize-none`}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Sprint</label>
            <input
              type="text"
              name="sprint"
              value={form.sprint ?? ''}
              onChange={handleChange}
              placeholder="e.g. Sprint 5"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Version</label>
            <input
              type="text"
              name="version"
              value={form.version ?? ''}
              onChange={handleChange}
              placeholder="e.g. 1.4.2"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Target Date</label>
          <input
            type="date"
            name="targetDate"
            value={form.targetDate ?? ''}
            onChange={handleChange}
            className={inputClass}
          />
        </div>
      </div>
    </Modal>
  );
}
