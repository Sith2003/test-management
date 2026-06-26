'use client';

import { useState } from 'react';
import { Modal } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';
import { useCreateAdhocCase } from '@/features/adhoc/hooks/useAdhoc';
import { UrgencyFlag } from '@/shared/types';
import type { CreateAdhocInput } from '@/shared/types';

interface CreateAdhocModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

const inputClass =
  'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400';

const textareaClass =
  'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 resize-none';

const labelClass = 'block text-xs font-medium text-gray-700 mb-1';

function getTodayIso(): string {
  return new Date().toISOString().split('T')[0];
}

const defaultForm: CreateAdhocInput = {
  issueDescription: '',
  requestor: '',
  requestDate: getTodayIso(),
  requestType: '',
  urgency: UrgencyFlag.NORMAL,
  sourceSystem: '',
  module: '',
  impactAssessment: '',
  affectedEnvironment: '',
  notes: '',
};

export function CreateAdhocModal({ projectId, isOpen, onClose }: CreateAdhocModalProps) {
  const createAdhoc = useCreateAdhocCase(projectId);
  const [form, setForm] = useState<CreateAdhocInput>(defaultForm);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleClose = () => {
    setForm({ ...defaultForm, requestDate: getTodayIso() });
    onClose();
  };

  const handleSubmit = () => {
    if (!form.issueDescription.trim() || !form.requestor.trim()) return;

    const payload: CreateAdhocInput = {
      issueDescription: form.issueDescription.trim(),
      requestor: form.requestor.trim(),
      ...(form.requestDate && { requestDate: form.requestDate }),
      ...(form.requestType?.trim() && { requestType: form.requestType.trim() }),
      urgency: form.urgency,
      ...(form.sourceSystem?.trim() && { sourceSystem: form.sourceSystem.trim() }),
      ...(form.module?.trim() && { module: form.module.trim() }),
      ...(form.impactAssessment?.trim() && { impactAssessment: form.impactAssessment.trim() }),
      ...(form.affectedEnvironment?.trim() && { affectedEnvironment: form.affectedEnvironment.trim() }),
      ...(form.notes?.trim() && { notes: form.notes.trim() }),
    };

    createAdhoc.mutate(payload, {
      onSuccess: () => {
        setForm({ ...defaultForm, requestDate: getTodayIso() });
        onClose();
      },
    });
  };

  const isSubmitDisabled =
    !form.issueDescription.trim() || !form.requestor.trim() || createAdhoc.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="New Ad-Hoc Case"
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={createAdhoc.isPending}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={createAdhoc.isPending}
            disabled={isSubmitDisabled}
          >
            Submit Case
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Issue Description */}
        <div>
          <label className={labelClass}>
            Issue Description <span className="text-red-500">*</span>
          </label>
          <textarea
            name="issueDescription"
            value={form.issueDescription}
            onChange={handleChange}
            rows={3}
            placeholder="Describe the issue or special test request in detail..."
            className={textareaClass}
          />
        </div>

        {/* Requestor + Request Date */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>
              Requestor <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="requestor"
              value={form.requestor}
              onChange={handleChange}
              placeholder="e.g. John Smith"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Request Date</label>
            <input
              type="date"
              name="requestDate"
              value={form.requestDate ?? ''}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
        </div>

        {/* Request Type + Urgency */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Request Type</label>
            <input
              type="text"
              name="requestType"
              value={form.requestType ?? ''}
              onChange={handleChange}
              placeholder="e.g. Bug Fix, New Feature"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Urgency</label>
            <select
              name="urgency"
              value={form.urgency}
              onChange={handleChange}
              className={inputClass}
            >
              {Object.values(UrgencyFlag).map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Source System + Module */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Source System</label>
            <input
              type="text"
              name="sourceSystem"
              value={form.sourceSystem ?? ''}
              onChange={handleChange}
              placeholder="e.g. CRM, ERP, Mobile App"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Module / Feature</label>
            <input
              type="text"
              name="module"
              value={form.module ?? ''}
              onChange={handleChange}
              placeholder="e.g. Authentication, Payments"
              className={inputClass}
            />
          </div>
        </div>

        {/* Impact Assessment */}
        <div>
          <label className={labelClass}>Impact Assessment</label>
          <textarea
            name="impactAssessment"
            value={form.impactAssessment ?? ''}
            onChange={handleChange}
            rows={2}
            placeholder="Describe the business or technical impact..."
            className={textareaClass}
          />
        </div>

        {/* Affected Environment + (empty placeholder for grid symmetry) */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Affected Environment</label>
            <input
              type="text"
              name="affectedEnvironment"
              value={form.affectedEnvironment ?? ''}
              onChange={handleChange}
              placeholder="e.g. Staging, Production"
              className={inputClass}
            />
          </div>
          <div />
        </div>

        {/* Notes */}
        <div>
          <label className={labelClass}>Notes</label>
          <textarea
            name="notes"
            value={form.notes ?? ''}
            onChange={handleChange}
            rows={2}
            placeholder="Any additional context or notes..."
            className={textareaClass}
          />
        </div>
      </div>
    </Modal>
  );
}
