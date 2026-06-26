'use client';

import { useState } from 'react';
import { TrashIcon } from '@heroicons/react/24/outline';
import { useTestCaseComments, useAddTestCaseComment, useDeleteTestCaseComment } from '@/features/test-cases/hooks/useTestCases';
import { useAuthStore } from '@/shared/stores/authStore';
import { Spinner } from '@/shared/components/ui/Spinner';

interface TestCaseCommentsProps {
  projectId: string;
  caseId: string;
}

export function TestCaseComments({ projectId, caseId }: TestCaseCommentsProps) {
  const { user } = useAuthStore();
  const { data: comments, isLoading } = useTestCaseComments(projectId, caseId);
  const addComment = useAddTestCaseComment(projectId, caseId);
  const deleteComment = useDeleteTestCaseComment(projectId, caseId);
  const [content, setContent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    addComment.mutate(content.trim(), {
      onSuccess: () => setContent(''),
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-900">Comments</h3>

      {isLoading ? (
        <Spinner size="sm" />
      ) : comments && comments.length > 0 ? (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 group">
              <div className="h-7 w-7 rounded-full bg-primary-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                {comment.author.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-medium text-gray-900">{comment.author.name}</span>
                  <span className="text-[11px] text-gray-400">
                    {new Date(comment.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
              </div>
              {(user?.id === comment.authorId) && (
                <button
                  onClick={() => deleteComment.mutate(comment.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-300 hover:text-red-500 shrink-0"
                >
                  <TrashIcon className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-400">No comments yet.</p>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add a comment…"
          rows={2}
          className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 resize-none"
        />
        <button
          type="submit"
          disabled={!content.trim() || addComment.isPending}
          className="px-3 py-2 bg-primary-500 text-white text-xs font-medium rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors self-end"
        >
          Post
        </button>
      </form>
    </div>
  );
}
