'use client';

import { useQuery } from '@tanstack/react-query';
import { reportService } from '@/features/reports/services/reportService';
export type { ReleaseReadinessData, SprintSummaryData } from '@/features/reports/services/reportService';

export const reportKeys = {
  summary: (projectId: string) => ['reports', projectId, 'summary'] as const,
  runHistory: (projectId: string) => ['reports', projectId, 'runs'] as const,
  suiteBreakdown: (projectId: string) =>
    ['reports', projectId, 'suites'] as const,
  defectTrend: (projectId: string) =>
    ['reports', projectId, 'defect-trend'] as const,
  passRateTrend: (projectId: string) =>
    ['reports', projectId, 'pass-rate-trend'] as const,
  automationCoverage: (projectId: string) =>
    ['reports', projectId, 'automation-coverage'] as const,
  requirementCoverage: (projectId: string) =>
    ['reports', projectId, 'requirement-coverage'] as const,
  releaseReadiness: (projectId: string, sprint?: string, version?: string) =>
    ['reports', projectId, 'release-readiness', sprint, version] as const,
  sprintSummary: (projectId: string, sprint?: string, version?: string) =>
    ['reports', projectId, 'sprint-summary', sprint, version] as const,
};

export function useSummaryReport(projectId: string) {
  return useQuery({
    queryKey: reportKeys.summary(projectId),
    queryFn: () => reportService.getSummary(projectId),
    enabled: !!projectId,
  });
}

export function useRunHistory(projectId: string) {
  return useQuery({
    queryKey: reportKeys.runHistory(projectId),
    queryFn: () => reportService.getRunHistory(projectId),
    enabled: !!projectId,
  });
}

export function useSuiteBreakdown(projectId: string) {
  return useQuery({
    queryKey: reportKeys.suiteBreakdown(projectId),
    queryFn: () => reportService.getSuiteBreakdown(projectId),
    enabled: !!projectId,
  });
}

export function useDefectTrend(projectId: string) {
  return useQuery({
    queryKey: reportKeys.defectTrend(projectId),
    queryFn: () => reportService.getDefectTrend(projectId),
    enabled: !!projectId,
  });
}

export function usePassRateTrend(projectId: string) {
  return useQuery({
    queryKey: reportKeys.passRateTrend(projectId),
    queryFn: () => reportService.getPassRateTrend(projectId),
    enabled: !!projectId,
  });
}

export function useAutomationCoverage(projectId: string) {
  return useQuery({
    queryKey: reportKeys.automationCoverage(projectId),
    queryFn: () => reportService.getAutomationCoverage(projectId),
    enabled: !!projectId,
  });
}

export function useRequirementCoverage(projectId: string) {
  return useQuery({
    queryKey: reportKeys.requirementCoverage(projectId),
    queryFn: () => reportService.getRequirementCoverage(projectId),
    enabled: !!projectId,
  });
}

export function useReleaseReadiness(projectId: string, sprint?: string, version?: string) {
  return useQuery({
    queryKey: reportKeys.releaseReadiness(projectId, sprint, version),
    queryFn: () => reportService.getReleaseReadiness(projectId, sprint, version),
    enabled: !!projectId,
  });
}

export function useSprintSummary(projectId: string, sprint?: string, version?: string) {
  return useQuery({
    queryKey: reportKeys.sprintSummary(projectId, sprint, version),
    queryFn: () => reportService.getSprintSummary(projectId, sprint, version),
    enabled: !!projectId,
  });
}
