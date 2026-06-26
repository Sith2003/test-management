'use client';

import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowUpTrayIcon, DocumentArrowDownIcon, XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { Button } from '@/shared/components/ui/Button';
import { Spinner } from '@/shared/components/ui/Spinner';
import { PageHeader } from '@/shared/components/PageHeader';
import { uploadService } from '@/features/upload/services/uploadService';
import type { UploadPreviewResponse } from '@/shared/types';

interface UploadFormProps {
  projectId: string;
}

export function UploadForm({ projectId }: UploadFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<UploadPreviewResponse | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const previewMutation = useMutation({
    mutationFn: (file: File) => uploadService.previewUpload(projectId, file),
    onSuccess: (data) => setPreviewData(data),
    onError: () => toast.error('Failed to parse file. Please check the format.'),
  });

  const importMutation = useMutation({
    mutationFn: (file: File) => uploadService.importUpload(projectId, file),
    onSuccess: (data) => {
      toast.success(`Imported ${data.imported} test cases${data.failed > 0 ? ` (${data.failed} failed)` : ''}`);
      setSelectedFile(null);
      setPreviewData(null);
    },
    onError: () => toast.error('Import failed. Please try again.'),
  });

  const handleFileSelect = (file: File) => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!['.xlsx', '.xls', '.csv'].includes(ext)) {
      toast.error('Please select an Excel (.xlsx, .xls) or CSV file');
      return;
    }
    setSelectedFile(file);
    setPreviewData(null);
    previewMutation.mutate(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreviewData(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div>
      <PageHeader
        title="Import Test Cases"
        description="Upload an Excel or CSV file to import test cases in bulk"
        actions={
          <a
            href={uploadService.getTemplateUrl(projectId)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-600 transition-colors"
          >
            <DocumentArrowDownIcon className="h-4 w-4" />
            Download Template
          </a>
        }
      />

      <div className="px-8 py-6 max-w-3xl space-y-6">
        {/* Drop zone */}
        <div
          className={clsx(
            'border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer',
            isDragging
              ? 'border-primary-400 bg-primary-50/50'
              : selectedFile
              ? 'border-primary-300 bg-primary-50/30'
              : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50/50'
          )}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
            className="hidden"
          />

          {selectedFile ? (
            <div className="space-y-2">
              <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center mx-auto">
                <CheckCircleIcon className="h-6 w-6 text-primary-600" />
              </div>
              <p className="font-medium text-gray-900">{selectedFile.name}</p>
              <p className="text-sm text-gray-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
              <button
                onClick={(e) => { e.stopPropagation(); handleClear(); }}
                className="inline-flex items-center gap-1 text-sm text-red-500 hover:text-red-700 transition-colors"
              >
                <XMarkIcon className="h-4 w-4" /> Remove file
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
                <ArrowUpTrayIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div>
                <p className="text-base font-medium text-gray-700">Drop your file here, or click to browse</p>
                <p className="text-sm text-gray-400 mt-1">Supports .xlsx, .xls, and .csv</p>
              </div>
            </div>
          )}
        </div>

        {/* Parsing indicator */}
        {previewMutation.isPending && (
          <div className="flex items-center gap-3 text-sm text-gray-600 bg-white rounded-xl ring-1 ring-gray-900/[0.06] px-5 py-4">
            <Spinner size="sm" />
            <span>Parsing file…</span>
          </div>
        )}

        {/* Empty file warning */}
        {previewData && previewData.rows.length === 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            No data rows found in the file. Please check the format.
          </div>
        )}

        {/* Preview table */}
        {previewData && previewData.rows.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Preview</h2>
                <p className="text-xs text-gray-500 mt-0.5">{previewData.total} rows detected</p>
              </div>
              <Button
                variant="primary"
                onClick={() => selectedFile && importMutation.mutate(selectedFile)}
                isLoading={importMutation.isPending}
              >
                Import {previewData.total} Test Cases
              </Button>
            </div>

            <div className="bg-white rounded-xl ring-1 ring-gray-900/[0.06] overflow-hidden">
              <div className="overflow-x-auto max-h-96">
                <table className="min-w-full divide-y divide-gray-100 text-sm">
                  <thead className="sticky top-0 bg-gray-50/90 backdrop-blur-sm">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                      {previewData.headers.map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {previewData.rows.slice(0, 50).map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/60">
                        <td className="px-4 py-2.5 text-gray-400 text-xs">{idx + 1}</td>
                        {previewData.headers.map((h) => (
                          <td key={h} className="px-4 py-2.5 text-gray-700 max-w-xs truncate">{String(row[h] ?? '')}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {previewData.rows.length > 50 && (
                <div className="px-4 py-3 bg-gray-50/70 text-xs text-gray-500 border-t border-gray-100">
                  Showing first 50 of {previewData.total} rows
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
