'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { PaperClipIcon, XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { Modal } from '@/shared/components/ui/Modal';
import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';
import { useCreateProject } from '@/features/projects/hooks/useProjects';
import { uploadService } from '@/features/upload/services/uploadService';

const createProjectSchema = z.object({
  name: z.string().min(2, 'Project name must be at least 2 characters'),
  key: z
    .string()
    .min(2, 'Key must be at least 2 characters')
    .max(10, 'Key must be at most 10 characters')
    .regex(/^[A-Z0-9]+$/, 'Key must be uppercase letters and numbers only'),
});

type CreateProjectFormValues = z.infer<typeof createProjectSchema>;

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateProjectModal({ isOpen, onClose }: CreateProjectModalProps) {
  const createProject = useCreateProject();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const importMutation = useMutation({
    mutationFn: ({ projectId, file }: { projectId: string; file: File }) =>
      uploadService.importUpload(projectId, file),
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CreateProjectFormValues>({
    resolver: zodResolver(createProjectSchema),
  });

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const autoKey = name
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, '')
      .split(/\s+/)
      .map((w) => w.charAt(0))
      .join('')
      .slice(0, 6);
    setValue('key', autoKey, { shouldValidate: false });
  };

  const handleFileSelect = (file: File) => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!['.xlsx', '.xls', '.csv'].includes(ext)) {
      toast.error('Please select an Excel (.xlsx, .xls) or CSV file');
      return;
    }
    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const isLoading = createProject.isPending || importMutation.isPending;

  const handleLogoSelect = (file: File) => {
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
    if (!allowed.includes(file.type)) {
      toast.error('Please select an image file (PNG, JPG, SVG, WebP)');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo must be smaller than 2 MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => setLogoPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const doClose = () => {
    reset();
    setSelectedFile(null);
    setLogoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (logoInputRef.current) logoInputRef.current.value = '';
    onClose();
  };

  const onSubmit = (data: CreateProjectFormValues) => {
    createProject.mutate({ ...data, logoUrl: logoPreview ?? undefined }, {
      onSuccess: (project) => {
        if (selectedFile) {
          importMutation.mutate(
            { projectId: project.id, file: selectedFile },
            {
              onSuccess: (result) => {
                toast.success(
                  `Imported ${result.imported} test case${result.imported !== 1 ? 's' : ''}${result.failed > 0 ? ` (${result.failed} failed)` : ''}`
                );
                doClose();
              },
              onError: () => {
                toast.error('File import failed. You can re-import from the Import page.');
                doClose();
              },
            }
          );
        } else {
          doClose();
        }
      },
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => { if (!isLoading) doClose(); }}
      title="Create New Project"
      footer={
        <>
          <Button variant="secondary" onClick={doClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit(onSubmit)}
            isLoading={isLoading}
          >
            Create Project
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Project Name"
          placeholder="My Test Project"
          error={errors.name?.message}
          {...register('name', { onChange: handleNameChange })}
        />

        <Input
          label="Project Key"
          placeholder="MTP"
          helpText="Short identifier (uppercase letters and numbers only)"
          error={errors.key?.message}
          {...register('key')}
        />

        {/* Logo upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Project Logo{' '}
            <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            ref={logoInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleLogoSelect(f);
            }}
          />
          {logoPreview ? (
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoPreview}
                alt="Logo preview"
                width={48}
                height={48}
                className="object-contain rounded"
              />
              <span className="flex-1 text-sm text-gray-600 truncate">Logo selected</span>
              <button
                type="button"
                onClick={() => {
                  setLogoPreview(null);
                  if (logoInputRef.current) logoInputRef.current.value = '';
                }}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-gray-200 hover:border-gray-300 hover:bg-gray-50/50 transition-colors text-sm text-gray-500 w-full"
            >
              <PhotoIcon className="h-5 w-5 text-gray-400" />
              Click to upload logo (PNG, JPG, SVG, WebP · max 2 MB)
            </button>
          )}
        </div>

        {/* File attachment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Attach File{' '}
            <span className="text-gray-400 font-normal">(optional)</span>
          </label>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFileSelect(f);
            }}
          />

          {selectedFile ? (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm">
              <PaperClipIcon className="h-4 w-4 text-gray-400 shrink-0" />
              <span className="flex-1 text-gray-700 truncate">{selectedFile.name}</span>
              <span className="text-xs text-gray-400 shrink-0">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div
              className={`border-2 border-dashed rounded-lg px-4 py-4 text-center cursor-pointer transition-colors ${
                isDragging
                  ? 'border-primary-400 bg-primary-50/50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <p className="text-sm text-gray-500">
                Drop your file here, or{' '}
                <span className="text-primary-600 font-medium">click to browse</span>
              </p>
              <p className="text-xs text-gray-400 mt-0.5">Supports .xlsx, .xls, .csv</p>
            </div>
          )}

          <p className="mt-1.5 text-xs text-gray-400">
            Upload a template to import test cases when the project is created
          </p>
        </div>
      </form>
    </Modal>
  );
}
