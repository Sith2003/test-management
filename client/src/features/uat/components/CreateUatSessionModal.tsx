'use client';

import { useState } from 'react';
import { Modal } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';
import { useCreateUatSession } from '@/features/uat/hooks/useUat';

interface CreateUatSessionModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

const labelClass = 'block text-xs font-medium text-gray-700 mb-1';
const inputClass =
  'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-colors';

export function CreateUatSessionModal({
  projectId,
  isOpen,
  onClose,
}: CreateUatSessionModalProps) {
  const createSession = useCreateUatSession(projectId);

  const [name, setName] = useState('');
  const [version, setVersion] = useState('');
  const [environmentUrl, setEnvironmentUrl] = useState('');
  const [uatStartDate, setUatStartDate] = useState('');
  const [uatEndDate, setUatEndDate] = useState('');
  const [supportContact, setSupportContact] = useState('');
  const [nameError, setNameError] = useState('');

  const resetForm = () => {
    setName('');
    setVersion('');
    setEnvironmentUrl('');
    setUatStartDate('');
    setUatEndDate('');
    setSupportContact('');
    setNameError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      setNameError('Session name is required');
      return;
    }
    setNameError('');

    createSession.mutate(
      {
        name: name.trim(),
        version: version.trim() || undefined,
        environmentUrl: environmentUrl.trim() || undefined,
        uatStartDate: uatStartDate || undefined,
        uatEndDate: uatEndDate || undefined,
        supportContact: supportContact.trim() || undefined,
      },
      {
        onSuccess: () => {
          resetForm();
          onClose();
        },
      }
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="New UAT Session"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={createSession.isPending}
          >
            Create Session
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Session Name */}
        <div>
          <label className={labelClass}>
            Session Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className={inputClass}
            placeholder="e.g. Release 2.4 UAT"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (e.target.value.trim()) setNameError('');
            }}
          />
          {nameError && (
            <p className="mt-1 text-xs text-red-600">{nameError}</p>
          )}
        </div>

        {/* Version */}
        <div>
          <label className={labelClass}>Version / Release</label>
          <input
            type="text"
            className={inputClass}
            placeholder="e.g. v2.4.0"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
          />
        </div>

        {/* Environment URL */}
        <div>
          <label className={labelClass}>Environment URL</label>
          <input
            type="text"
            className={inputClass}
            placeholder="https://uat.example.com"
            value={environmentUrl}
            onChange={(e) => setEnvironmentUrl(e.target.value)}
          />
        </div>

        {/* Date fields — 2-column grid */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Start Date</label>
            <input
              type="date"
              className={inputClass}
              value={uatStartDate}
              onChange={(e) => setUatStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>End Date</label>
            <input
              type="date"
              className={inputClass}
              value={uatEndDate}
              onChange={(e) => setUatEndDate(e.target.value)}
            />
          </div>
        </div>

        {/* Support Contact */}
        <div>
          <label className={labelClass}>Support Contact</label>
          <input
            type="text"
            className={inputClass}
            placeholder="e.g. john@example.com"
            value={supportContact}
            onChange={(e) => setSupportContact(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
}
