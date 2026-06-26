import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional } from 'class-validator';

export class ImportDto {
  @ApiProperty({ description: 'Project UUID to import test cases into' })
  @IsUUID()
  projectId!: string;

  @ApiProperty({ required: false, description: 'Default suite UUID to assign imported cases to' })
  @IsOptional()
  @IsUUID()
  suiteId?: string;
}

export interface DetectedColumn {
  header: string;
  mappedTo: string | null;
  index: number;
}

export interface PreviewRow {
  rowIndex: number;
  data: Record<string, unknown>;
}

export interface ParsedPreviewResult {
  detectedColumns: DetectedColumn[];
  preview: PreviewRow[];
  totalRows: number;
  fileName: string;
  fileType: 'xlsx' | 'csv';
}
