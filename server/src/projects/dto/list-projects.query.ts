import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, Max, MaxLength } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { PAGINATION, SEARCH } from '../../shared/constants/pagination.constants';

export class ListProjectsQuery {
  @ApiProperty({ required: false, default: PAGINATION.DEFAULT_PAGE })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(PAGINATION.MAX_PAGE)
  page?: number = PAGINATION.DEFAULT_PAGE;

  @ApiProperty({ required: false, default: PAGINATION.DEFAULT_LIMIT })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(PAGINATION.MIN_LIMIT)
  @Max(PAGINATION.MAX_LIMIT)
  limit?: number = PAGINATION.DEFAULT_LIMIT;

  @ApiProperty({ required: false, description: 'Search by name or key' })
  @IsOptional()
  @IsString()
  @MaxLength(SEARCH.MAX_LENGTH)
  @Transform(({ value }: { value: string }) => value?.trim())
  search?: string;
}
