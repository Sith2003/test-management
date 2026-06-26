'use client';

import { useState } from 'react';
import { CheckCircleIcon, XCircleIcon, ArrowUpTrayIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { useReviewTestCase } from '@/features/test-cases/hooks/useTestCases';
import { useAuthStore } from '@/shared/stores/authStore';
import { ReviewStatus, UserRole, type TestCase } from '@/shared/types';

interface ReviewWorkflowSectionProps {
  projectId: string;
  testCase: TestCase;
}

const STATUS_LABELS: Record<ReviewStatus, string> = {
  [ReviewStatus.DRAFT]: 'Draft',
  [ReviewStatus.READY]: 'Ready for Review',
  [ReviewStatus.IN_REVIEW]: 'In Review',
  [ReviewStatus.APPROVED]: 'Approved',
  [ReviewStatus.REJECTED]: 'Rejected',
};

export function ReviewWorkflowSection({ projectId, testCase }: ReviewWorkflowSectionProps) {
  const { user } = useAuthStore();
  const review = useReviewTestCase(projectId, testCase.id);
  const [rejectComment, setRejectComment] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  const isReviewer = user?.role === UserRole.ADMIN || user?.role === UserRole.MANAGER;
  const status = testCase.reviewStatus as ReviewStatus;

  const canSubmit =
    status === ReviewStatus.DRAFT ||
    status === ReviewStatus.READY ||
    status === ReviewStatus.REJECTED;

  const canReview = isReviewer && status === ReviewStatus.IN_REVIEW;
  const canReopen = isReviewer && status === ReviewStatus.APPROVED;

  const handleSubmit = () => {
    review.mutate({ status: ReviewStatus.IN_REVIEW });
  };

  const handleApprove = () => {
    review.mutate({ status: ReviewStatus.APPROVED });
  };

  const handleReject = () => {
    if (!rejectComment.trim()) return;
    review.mutate(
      { status: ReviewStatus.REJECTED, comment: rejectComment.trim() },
      {
        onSuccess: () => {
          setRejectComment('');
          setShowRejectForm(false);
        },
      }
    );
  };

  const handleReopen = () => {
    review.mutate({ status: ReviewStatus.IN_REVIEW });
  };

  return (
    <div className="bg-white rounded-xl ring-1 ring-gray-900/[0.06] p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
        Review Workflow
      </h3>

      {/* Current status */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xs text-gray-500">Status:</span>
        <Badge variant={status}>{STATUS_LABELS[status]}</Badge>
      </div>

      {/* Rejection reason */}
      {status === ReviewStatus.REJECTED && testCase.reviewComment && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-100 px-3 py-2.5">
          <p className="text-xs font-medium text-red-700 flex items-center gap-1 mb-1">
            <ChatBubbleLeftIcon className="h-3.5 w-3.5" />
            Rejection Reason
          </p>
          <p className="text-xs text-red-600 whitespace-pre-wrap">{testCase.reviewComment}</p>
        </div>
      )}

      {/* Approval note */}
      {status === ReviewStatus.APPROVED && testCase.reviewComment && (
        <div className="mb-4 rounded-lg bg-green-50 border border-green-100 px-3 py-2.5">
          <p className="text-xs font-medium text-green-700 flex items-center gap-1 mb-1">
            <ChatBubbleLeftIcon className="h-3.5 w-3.5" />
            Reviewer Note
          </p>
          <p className="text-xs text-green-600 whitespace-pre-wrap">{testCase.reviewComment}</p>
        </div>
      )}

      {/* Workflow steps */}
      <div className="flex items-center gap-2 mb-4 text-xs text-gray-400">
        {[
          { s: ReviewStatus.DRAFT, label: 'Draft' },
          { s: ReviewStatus.IN_REVIEW, label: 'In Review' },
          { s: ReviewStatus.APPROVED, label: 'Approved' },
        ].map((step, i, arr) => (
          <div key={step.s} className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded-full ${
                status === step.s
                  ? 'bg-primary-100 text-primary-700 font-medium'
                  : status === ReviewStatus.REJECTED && step.s === ReviewStatus.IN_REVIEW
                  ? 'bg-red-100 text-red-600 font-medium'
                  : 'text-gray-400'
              }`}
            >
              {step.label}
            </span>
            {i < arr.length - 1 && <span className="text-gray-300">→</span>}
          </div>
        ))}
        {status === ReviewStatus.REJECTED && (
          <span className="text-red-500 font-medium">→ Rejected</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2">
        {/* Submit for review */}
        {canSubmit && (
          <Button
            variant="secondary"
            onClick={handleSubmit}
            isLoading={review.isPending}
            className="w-full justify-center"
          >
            <ArrowUpTrayIcon className="h-4 w-4 mr-1.5" />
            Submit for Review
          </Button>
        )}

        {/* Reviewer actions */}
        {canReview && !showRejectForm && (
          <div className="flex gap-2">
            <button
              onClick={handleApprove}
              disabled={review.isPending}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-semibold transition-colors disabled:opacity-50"
            >
              <CheckCircleIcon className="h-4 w-4" />
              Approve
            </button>
            <button
              onClick={() => setShowRejectForm(true)}
              disabled={review.isPending}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors disabled:opacity-50"
            >
              <XCircleIcon className="h-4 w-4" />
              Reject
            </button>
          </div>
        )}

        {/* Reject form */}
        {showRejectForm && (
          <div className="space-y-2">
            <textarea
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              placeholder="Explain why this test case is being rejected..."
              rows={3}
              className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 resize-none"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleReject}
                disabled={!rejectComment.trim() || review.isPending}
                className="flex-1 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors disabled:opacity-50"
              >
                Confirm Reject
              </button>
              <button
                onClick={() => { setShowRejectForm(false); setRejectComment(''); }}
                className="px-3 py-2 rounded-lg border border-gray-200 text-gray-600 text-xs font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Re-open review */}
        {canReopen && (
          <Button
            variant="secondary"
            onClick={handleReopen}
            isLoading={review.isPending}
            className="w-full justify-center text-xs"
          >
            Re-open Review
          </Button>
        )}
      </div>
    </div>
  );
}
