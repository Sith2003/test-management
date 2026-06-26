'use client';

import clsx from 'clsx';
import {
  ResultStatus, Priority, CaseStatus, RunStatus,
  DefectStatus, AdhocStatus, UatSessionStatus, UatResultStatus,
  ChecklistEntryStatus, Severity, AutomationStatus, PlanStatus, ReviewStatus,
} from '@/shared/types';

type BadgeVariant =
  | ResultStatus
  | Priority
  | CaseStatus
  | RunStatus
  | DefectStatus
  | AdhocStatus
  | UatSessionStatus
  | UatResultStatus
  | ChecklistEntryStatus
  | Severity
  | AutomationStatus
  | PlanStatus
  | ReviewStatus
  | 'default';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

// String-literal keys to avoid duplicate computed property issues when enums share values
const variantClasses: Record<string, string> = {
  // Pass / success
  PASS: 'bg-green-100 text-green-800',
  VERIFIED: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-green-100 text-green-800',
  RESOLVED: 'bg-green-100 text-green-800',
  SIGNED_OFF: 'bg-green-100 text-green-800',
  DONE: 'bg-green-100 text-green-800',
  AUTOMATED: 'bg-green-100 text-green-800',
  ACTIVE: 'bg-green-100 text-green-800',
  APPROVED: 'bg-green-100 text-green-800',

  // Fail / danger
  FAIL: 'bg-red-100 text-red-800',
  OPEN: 'bg-red-100 text-red-800',
  ABORTED: 'bg-red-100 text-red-800',
  ESCALATED: 'bg-red-100 text-red-800',
  CRITICAL: 'bg-red-100 text-red-800',
  REJECTED: 'bg-red-100 text-red-700',

  // Warning / in progress
  PENDING: 'bg-yellow-100 text-yellow-800',
  DRAFT: 'bg-gray-100 text-gray-600',
  READY: 'bg-yellow-100 text-yellow-800',
  PLANNED: 'bg-primary-100 text-primary-800',
  SKIPPED: 'bg-yellow-100 text-yellow-800',

  // Blue / in progress
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  IN_REVIEW: 'bg-blue-100 text-blue-800',
  MEDIUM: 'bg-blue-100 text-blue-800',

  // Special
  FIXED: 'bg-teal-100 text-teal-800',
  RETEST: 'bg-purple-100 text-purple-800',
  REOPENED: 'bg-orange-100 text-orange-800',
  BLOCKED: 'bg-orange-100 text-orange-800',
  HIGH: 'bg-orange-100 text-orange-800',

  // Neutral
  CLOSED: 'bg-gray-100 text-gray-600',
  WONTFIX: 'bg-gray-100 text-gray-600',
  ARCHIVED: 'bg-gray-100 text-gray-500',
  LOW: 'bg-gray-100 text-gray-600',
  MANUAL: 'bg-gray-100 text-gray-600',
  VIEWER: 'bg-gray-100 text-gray-600',

  default: 'bg-gray-100 text-gray-600',
};

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variantClasses[variant] ?? variantClasses.default,
        className
      )}
    >
      {children}
    </span>
  );
}
