import { IsArray, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { CaseStatus } from '@prisma/client';

export enum BulkAction {
  MOVE = 'move',
  SET_STATUS = 'setStatus',
  DELETE = 'delete',
}

export class BulkUpdateTestCasesDto {
  @IsArray()
  @IsUUID(undefined, { each: true })
  ids!: string[];

  @IsEnum(BulkAction)
  action!: BulkAction;

  @IsOptional()
  @IsUUID()
  suiteId?: string;

  @IsOptional()
  @IsEnum(CaseStatus)
  status?: CaseStatus;
}
