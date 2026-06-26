import { Injectable, NotFoundException } from '@nestjs/common';
import * as XLSX from 'xlsx';
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const PdfPrinter = require('pdfmake/js/Printer').default as any;
import { PrismaService } from '../prisma/prisma.service';
import { ProjectsService } from '../projects/projects.service';
import { JwtPayload } from '../shared/decorators/current-user.decorator';
import { ProjectMemberRole } from '@prisma/client';

const printer = new PdfPrinter({
  Helvetica: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique',
  },
});

@Injectable()
export class ExportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectsService: ProjectsService,
  ) {}

  async buildUatReportPdf(projectId: string, sessionId: string, user: JwtPayload): Promise<Buffer> {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.VIEWER);

    const session = await this.prisma.uatSession.findFirst({
      where: { id: sessionId, projectId },
      include: {
        createdBy: { select: { id: true, name: true } },
        signOffBy: { select: { id: true, name: true } },
        results: {
          include: {
            testCase: { select: { id: true, caseId: true, title: true } },
            tester: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!session) throw new NotFoundException('UAT session not found');

    const total = session.results.length;
    const pass = session.results.filter((r) => r.status === 'PASS').length;
    const fail = session.results.filter((r) => r.status === 'FAIL').length;
    const blocked = session.results.filter((r) => r.status === 'BLOCKED').length;
    const pending = session.results.filter((r) => r.status === 'PENDING').length;
    const passRate = total > 0 ? Math.round((pass / total) * 100) : 0;

    const formatDate = (d: Date | null | undefined) =>
      d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }) : 'N/A';

    const tableBody: unknown[][] = [
      [
        { text: 'Test Case', style: 'tableHeader' },
        { text: 'Title', style: 'tableHeader' },
        { text: 'Status', style: 'tableHeader' },
        { text: 'Tester', style: 'tableHeader' },
        { text: 'Comments', style: 'tableHeader' },
        { text: 'Evidence URL', style: 'tableHeader' },
      ],
    ];

    for (const result of session.results) {
      tableBody.push([
        result.testCase.caseId,
        result.testCase.title,
        result.status,
        result.tester?.name ?? 'N/A',
        result.comments ?? '',
        result.evidenceUrl ?? '',
      ]);
    }

    const docDefinition = {
      content: [
        { text: 'UAT Session Report', style: 'title' },
        { text: ' ' },
        {
          columns: [
            {
              width: '*',
              stack: [
                { text: [{ text: 'Session Name: ', bold: true }, session.name] },
                { text: [{ text: 'Version: ', bold: true }, session.version ?? 'N/A'] },
                { text: [{ text: 'Environment: ', bold: true }, session.environmentUrl ?? 'N/A'] },
                { text: [{ text: 'Status: ', bold: true }, session.status] },
              ],
            },
            {
              width: '*',
              stack: [
                {
                  text: [
                    { text: 'Start Date: ', bold: true },
                    formatDate(session.uatStartDate as Date | null),
                  ],
                },
                {
                  text: [
                    { text: 'End Date: ', bold: true },
                    formatDate(session.uatEndDate as Date | null),
                  ],
                },
                { text: [{ text: 'Created By: ', bold: true }, session.createdBy.name] },
              ],
            },
          ],
        },
        { text: ' ' },
        session.signOffBy
          ? {
              table: {
                widths: ['auto', '*'],
                body: [
                  [
                    { text: 'Sign-Off By', bold: true, fillColor: '#f0f0f0' },
                    session.signOffBy.name,
                  ],
                  [
                    { text: 'Sign-Off Date', bold: true, fillColor: '#f0f0f0' },
                    formatDate(session.signedOffAt),
                  ],
                  [
                    { text: 'Sign-Off Note', bold: true, fillColor: '#f0f0f0' },
                    session.signOffNote ?? '',
                  ],
                ],
              },
              layout: 'lightHorizontalLines',
            }
          : { text: 'Not yet signed off.', italics: true },
        { text: ' ' },
        { text: 'Summary Statistics', style: 'sectionHeader' },
        {
          columns: [
            { text: `Total: ${total}`, alignment: 'center' },
            { text: `Pass: ${pass}`, alignment: 'center', color: '#27ae60' },
            { text: `Fail: ${fail}`, alignment: 'center', color: '#e74c3c' },
            { text: `Blocked: ${blocked}`, alignment: 'center', color: '#e67e22' },
            { text: `Pending: ${pending}`, alignment: 'center', color: '#7f8c8d' },
            { text: `Pass Rate: ${passRate}%`, alignment: 'center', bold: true },
          ],
        },
        { text: ' ' },
        { text: 'Test Results', style: 'sectionHeader' },
        {
          table: {
            headerRows: 1,
            widths: ['auto', '*', 'auto', 'auto', '*', '*'],
            body: tableBody,
          },
          layout: 'lightHorizontalLines',
        },
      ],
      styles: {
        title: { fontSize: 20, bold: true, alignment: 'center' as const, margin: [0, 0, 0, 8] as [number, number, number, number] },
        sectionHeader: { fontSize: 14, bold: true, margin: [0, 8, 0, 4] as [number, number, number, number] },
        tableHeader: { bold: true, fillColor: '#2c3e50', color: '#ffffff' },
      },
      defaultStyle: { font: 'Helvetica', fontSize: 10 },
    };

    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    return new Promise<Buffer>((resolve) => {
      const chunks: Buffer[] = [];
      pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk));
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
      pdfDoc.end();
    });
  }

  async buildDefectsExcel(projectId: string): Promise<Buffer> {
    const defects = await this.prisma.defect.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      include: {
        assignedTo: { select: { name: true, email: true } },
        createdBy: { select: { name: true, email: true } },
        testCase: { select: { caseId: true, title: true } },
      },
    });

    const headers = [
      'ID', 'Title', 'Module', 'Severity', 'Priority', 'Status',
      'Description', 'Steps to Reproduce', 'Expected Result', 'Actual Result', 'Bug Pattern',
      'Linked Test Case', 'Assigned To', 'Reporter', 'Created At',
    ];
    const rows = defects.map((d) => [
      d.defectId,
      d.title,
      d.module ?? '',
      d.severity,
      d.priority,
      d.status,
      d.description ?? '',
      d.stepsToReproduce ?? '',
      d.expectedResult ?? '',
      d.actualResult ?? '',
      d.bugPattern ?? '',
      d.testCase ? `${d.testCase.caseId} - ${d.testCase.title}` : '',
      d.assignedTo ? (d.assignedTo.name ?? d.assignedTo.email) : '',
      d.createdBy ? (d.createdBy.name ?? d.createdBy.email) : '',
      new Date(d.createdAt).toISOString().split('T')[0],
    ]);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws['!cols'] = [
      { wch: 12 },  // ID
      { wch: 50 },  // Title
      { wch: 20 },  // Module
      { wch: 12 },  // Severity
      { wch: 12 },  // Priority
      { wch: 15 },  // Status
      { wch: 50 },  // Description
      { wch: 50 },  // Steps to Reproduce
      { wch: 40 },  // Expected Result
      { wch: 40 },  // Actual Result
      { wch: 30 },  // Bug Pattern
      { wch: 35 },  // Linked Test Case
      { wch: 25 },  // Assigned To
      { wch: 25 },  // Reporter
      { wch: 15 },  // Created At
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Defects');
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }

  async buildRunResultsExcel(projectId: string, runId: string, user: JwtPayload): Promise<Buffer> {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.VIEWER);

    const run = await this.prisma.testRun.findFirst({
      where: { id: runId, projectId },
    });
    if (!run) throw new NotFoundException('Test run not found');

    const results = await this.prisma.testResult.findMany({
      where: { runId },
      orderBy: { createdAt: 'asc' },
      include: {
        testCase: { select: { caseId: true, title: true } },
        assignee: { select: { name: true, email: true } },
      },
    });

    const headers = ['Test Case ID', 'Title', 'Status', 'Tester', 'Notes', 'Evidence URL', 'Executed At'];
    const rows = results.map((r) => [
      r.testCase.caseId,
      r.testCase.title,
      r.status,
      r.assignee ? (r.assignee.name ?? r.assignee.email) : '',
      r.notes ?? '',
      r.evidenceUrl ?? '',
      r.executedAt ? new Date(r.executedAt).toISOString().split('T')[0] : '',
    ]);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws['!cols'] = [
      { wch: 15 },
      { wch: 50 },
      { wch: 12 },
      { wch: 25 },
      { wch: 40 },
      { wch: 40 },
      { wch: 15 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Run Results');
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }
}
