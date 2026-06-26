import { DefectStatus } from '@/shared/types';

export const DEFECT_STATUS_LABELS: Record<DefectStatus, string> = {
  [DefectStatus.OPEN]:        'Open',
  [DefectStatus.IN_PROGRESS]: 'In Progress',
  [DefectStatus.FIXED]:       'Fixed',
  [DefectStatus.RETEST]:      'Needs Retest',
  [DefectStatus.VERIFIED]:    'Verified',
  [DefectStatus.REOPENED]:    'Reopened',
  [DefectStatus.CLOSED]:      'Closed',
  [DefectStatus.WONTFIX]:     "Won't Fix",
};

export const DEFECT_STATUS_TRANSITIONS: Record<DefectStatus, DefectStatus[]> = {
  [DefectStatus.OPEN]:        [DefectStatus.IN_PROGRESS, DefectStatus.WONTFIX],
  [DefectStatus.IN_PROGRESS]: [DefectStatus.FIXED, DefectStatus.OPEN, DefectStatus.WONTFIX],
  [DefectStatus.FIXED]:       [DefectStatus.RETEST, DefectStatus.IN_PROGRESS],
  [DefectStatus.RETEST]:      [DefectStatus.VERIFIED, DefectStatus.REOPENED],
  [DefectStatus.VERIFIED]:    [DefectStatus.CLOSED],
  [DefectStatus.REOPENED]:    [DefectStatus.IN_PROGRESS, DefectStatus.WONTFIX],
  [DefectStatus.CLOSED]:      [],
  [DefectStatus.WONTFIX]:     [],
};
