'use client';

import { useState } from 'react';
import { Modal } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';
import { useCreateRequirement } from '../hooks/useRequirements';
import { Priority } from '@/shared/types';
import type { CreateRequirementInput } from '@/shared/types';

interface CreateRequirementModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

const inputClass =
  'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400';
const textareaClass =
  'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 resize-none';
const labelClass = 'block text-xs font-medium text-gray-700 mb-1';

const defaultForm: CreateRequirementInput = {
  title: '',
  description: '',
  externalId: '',
  priority: Priority.MEDIUM,
};

export function CreateRequirementModal({ projectId, isOpen, onClose }: CreateRequirementModalProps) {
  const createRequirement = useCreateRequirement(projectId);
  const [form, setForm] = useState<CreateRequirementInput>(defaultForm);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleClose = () => {
    setForm(defaultForm);
    onClose();
  };

  const handleSubmit = () => {
    if (!form.title.trim()) return;

    const payload: CreateRequirementInput = {
      title: form.title.trim(),
      priority: form.priority,
      ...(form.description?.trim() && { description: form.description.trim() }),
      ...(form.externalId?.trim() && { externalId: form.externalId.trim() }),
    };

    createRequirement.mutate(payload, {
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
      title="New Requirement"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={createRequirement.isPending}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={createRequirement.isPending}
            disabled={!form.title.trim()}
          >
            Create Requirement
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
            placeholder="Short requirement title"
            className={inputClass}
          />
        </div>

        {/* External ID */}
        <div>
          <label className={labelClass}>External ID</label>
          <input
            type="text"
            name="externalId"
            value={form.externalId ?? ''}
            onChange={handleChange}
            placeholder="e.g. JIRA-123, REQ-001"
            className={inputClass}
          />
        </div>

        {/* Priority */}
        <div>
          <label className={labelClass}>Priority</label>
          <select
            name="priority"
            value={form.priority}
            onChange={handleChange}
            className={inputClass}
          >
            {Object.values(Priority).map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label className={labelClass}>Description</label>
          <textarea
            name="description"
            value={form.description ?? ''}
            onChange={handleChange}
            rows={3}
            placeholder="Describe the requirement..."
            className={textareaClass}
          />
        </div>
      </div>
    </Modal>
  );
}
