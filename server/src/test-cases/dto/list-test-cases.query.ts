import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  MaxLength,
  IsEnum,
  IsUUID,
  IsArray,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { Priority, CaseStatus, ReviewStatus } from '@prisma/client';
import { PAGINATION, SEARCH } from '../../shared/constants/pagination.constants';

export enum TestCaseSortBy {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  TITLE = 'title',
  PRIORITY = 'priority',
  STATUS = 'status',
  CASE_ID = 'caseId',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class ListTestCasesQuery {
  @ApiProperty({ required: false, default: PAGINATION.DEFAULT_PAGE })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(PAGINATION.MAX_PAGE)
  page?: number = PAGINATION.DEFAULT_PAGE;

  @ApiProperty({ required: false, default: PAGINATION.DEFAULT_LIMIT, maximum: PAGINATION.MAX_LIMIT })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(PAGINATION.MIN_LIMIT)
  @Max(PAGINATION.MAX_LIMIT)
  limit?: number = PAGINATION.DEFAULT_LIMIT;

  @ApiProperty({ required: false, description: 'Search by title, description, or case ID' })
  @IsOptional()
  @IsString()
  @MaxLength(SEARCH.MAX_LENGTH)
  @Transform(({ value }: { value: string }) => value?.trim())
  search?: string;

  @ApiProperty({ required: false, description: 'Filter by suite UUID' })
  @IsOptional()
  @IsUUID()
  suiteId?: string;

  @ApiProperty({ enum: Priority, required: false })
  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @ApiProperty({ enum: CaseStatus, required: false })
  @IsOptional()
  @IsEnum(CaseStatus)
  status?: CaseStatus;

  @ApiProperty({ enum: ReviewStatus, required: false, description: 'Filter by review status' })
  @IsOptional()
  @IsEnum(ReviewStatus)
  reviewStatus?: ReviewStatus;

  @ApiProperty({ required: false, description: 'Filter by scenario name (exact match)' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }: { value: string }) => value?.trim())
  scenario?: string;

  @ApiProperty({ required: false, description: 'Filter by tag (exact match)' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(({ value }: { value: string }) => value?.trim())
  tag?: string;

  @ApiProperty({ enum: TestCaseSortBy, required: false, default: TestCaseSortBy.CREATED_AT })
  @IsOptional()
  @IsEnum(TestCaseSortBy)
  sortBy?: TestCaseSortBy = TestCaseSortBy.CREATED_AT;

  @ApiProperty({ enum: SortOrder, required: false, default: SortOrder.DESC })
  @IsOptional()
  @IsEnum(SortOrder)
  order?: SortOrder = SortOrder.DESC;
}
