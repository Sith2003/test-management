'use client';

import { useRef } from 'react';
import {
  ArrowUpTrayIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  DocumentIcon,
  DocumentTextIcon,
  PhotoIcon,
  TableCellsIcon,
} from '@heroicons/react/24/outline';
import { Modal } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';
import { Spinner } from '@/shared/components/ui/Spinner';
import {
  useRequirementDocuments,
  useUploadDocument,
  useDeleteDocument,
} from '../hooks/useRequirements';
import type { Requirement } from '@/shared/types';
import { formatDate } from '@/shared/utils/date';

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ?? 'http://localhost:3001';

const ACCEPTED = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
].join(',');

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.startsWith('image/')) return <PhotoIcon className="h-5 w-5 text-blue-400" />;
  if (mimeType.includes('pdf')) return <DocumentTextIcon className="h-5 w-5 text-red-400" />;
  if (mimeType.includes('sheet') || mimeType.includes('excel') || mimeType.includes('csv'))
    return <TableCellsIcon className="h-5 w-5 text-green-500" />;
  return <DocumentIcon className="h-5 w-5 text-gray-400" />;
}

interface Props {
  projectId: string;
  requirement: Requirement;
  isOpen: boolean;
  onClose: () => void;
}

function ModalContent({ projectId, requirement, onClose }: Omit<Props, 'isOpen'>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: documents = [], isLoading } = useRequirementDocuments(projectId, requirement.id);
  const upload = useUploadDocument(projectId, requirement.id);
  const deleteDoc = useDeleteDocument(projectId, requirement.id);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    files.forEach((file) => upload.mutate(file));
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    files.forEach((file) => upload.mutate(file));
  };

  return (
    <div>
      {/* Drop zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-primary-300 hover:bg-primary-50/30 transition-colors mb-4"
      >
        <ArrowUpTrayIcon className="h-8 w-8 text-gray-300 mx-auto mb-2" />
        <p className="text-sm font-medium text-gray-600">
          {upload.isPending ? 'Uploading...' : 'Click or drag files here to upload'}
        </p>
        <p className="text-xs text-gray-400 mt-1">PDF, Word, Excel, CSV, Images — max 20 MB each</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED}
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Document list */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner size="md" />
        </div>
      ) : documents.length === 0 ? (
        <div className="py-8 text-center text-sm text-gray-400">
          No documents uploaded yet.
        </div>
      ) : (
        <ul className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
          {documents.map((doc) => (
            <li key={doc.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
              <FileIcon mimeType={doc.mimeType} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
                <p className="text-xs text-gray-400">
                  {formatBytes(doc.size)} · {formatDate(doc.uploadedAt)}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <a
                  href={`${API_BASE}${doc.url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={doc.name}
                  className="p-1.5 rounded-md text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                  title="Download"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                </a>
                <button
                  onClick={() => {
                    if (window.confirm(`Delete "${doc.name}"?`)) deleteDoc.mutate(doc.id);
                  }}
                  disabled={deleteDoc.isPending}
                  className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                  title="Delete"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="flex justify-end mt-4 pt-4 border-t border-gray-100">
        <Button variant="secondary" size="sm" onClick={onClose}>Close</Button>
      </div>
    </div>
  );
}

export function RequirementDocumentsModal({ isOpen, onClose, ...props }: Props) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Documents — ${props.requirement.reqId}`}
      size="lg"
    >
      {isOpen && <ModalContent {...props} onClose={onClose} />}
    </Modal>
  );
}
