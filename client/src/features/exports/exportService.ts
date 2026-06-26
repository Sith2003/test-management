import api from '@/shared/services/api';

export const exportService = {
  async downloadDefectsExcel(projectId: string) {
    const res = await api.get(`/projects/${projectId}/exports/defects/excel`, { responseType: 'blob' });
    const url = URL.createObjectURL(new Blob([res as unknown as BlobPart]));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'defects.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  },
  async downloadRunResultsExcel(projectId: string, runId: string) {
    const res = await api.get(`/projects/${projectId}/exports/runs/${runId}/results/excel`, { responseType: 'blob' });
    const url = URL.createObjectURL(new Blob([res as unknown as BlobPart]));
    const a = document.createElement('a');
    a.href = url;
    a.download = `run-results-${runId}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  },
  async downloadUatReportPdf(projectId: string, sessionId: string) {
    const res = await api.get(`/projects/${projectId}/exports/uat-report/${sessionId}/pdf`, { responseType: 'blob' });
    const url = URL.createObjectURL(new Blob([res as unknown as BlobPart], { type: 'application/pdf' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `uat-report-${sessionId}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  },
};
