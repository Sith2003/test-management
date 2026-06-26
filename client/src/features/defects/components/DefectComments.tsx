'use client';

import { useState } from 'react';
import { TrashIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import { Button } from '@/shared/components/ui/Button';
import { Spinner } from '@/shared/components/ui/Spinner';
import {
  useDefectComments,
  useAddDefectComment,
  useDeleteDefectComment,
} from '@/features/defects/hooks/useDefects';
import { useAuthStore } from '@/shared/stores/authStore';

interface DefectCommentsProps {
  projectId: string;
  defectId: string;
}

function relativeTime(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(isoDate).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function DefectComments({ projectId, defectId }: DefectCommentsProps) {
  const { user } = useAuthStore();
  const { data: comments, isLoading } = useDefectComments(projectId, defectId);
  const addComment = useAddDefectComment(projectId, defectId);
  const deleteComment = useDeleteDefectComment(projectId, defectId);

  const [draft, setDraft] = useState('');

  const handlePost = () => {
    const content = draft.trim();
    if (!content) return;
    addComment.mutate(content, {
      onSuccess: () => setDraft(''),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handlePost();
    }
  };

  return (
    <div className="bg-white rounded-xl ring-1 ring-gray-900/[0.06] p-6">
      <div className="flex items-center gap-2 mb-5">
        <ChatBubbleLeftIcon className="h-4 w-4 text-gray-400" />
        <h2 className="text-sm font-semibold text-gray-900">
          Comments {comments && comments.length > 0 && (
            <span className="ml-1 text-gray-400 font-normal">({comments.length})</span>
          )}
        </h2>
      </div>

      {/* Comment thread */}
      {isLoading ? (
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      ) : comments && comments.length > 0 ? (
        <div className="space-y-4 mb-6">
          {comments.map((comment) => {
            const isOwn = user?.id === comment.authorId;
            return (
              <div key={comment.id} className="flex gap-3 group">
                {/* Avatar */}
                <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-xs font-semibold text-primary-700 shrink-0 uppercase">
                  {comment.author.name.charAt(0)}
                </div>

                {/* Body */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">
                      {comment.author.name}
                    </span>
                    <span className="text-xs text-gray-400">
                      {relativeTime(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                    {comment.content}
                  </p>
                </div>

                {/* Delete (own only) */}
                {isOwn && (
                  <button
                    onClick={() => deleteComment.mutate(comment.id)}
                    disabled={deleteComment.isPending}
                    className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed self-start shrink-0"
                    aria-label="Delete comment"
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-gray-400 text-center py-6 mb-4">
          No comments yet. Be the first to comment.
        </p>
      )}

      {/* Compose */}
      <div className="border-t border-gray-100 pt-5">
        <label className="block text-xs font-medium text-gray-600 mb-1.5">
          Add a comment
        </label>
        <textarea
          rows={3}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write a comment... (Ctrl+Enter to submit)"
          className="block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-colors resize-none"
        />
        <div className="flex items-center justify-end mt-2">
          <Button
            variant="primary"
            size="sm"
            onClick={handlePost}
            isLoading={addComment.isPending}
            disabled={!draft.trim()}
          >
            Post Comment
          </Button>
        </div>
      </div>
    </div>
  );
}
