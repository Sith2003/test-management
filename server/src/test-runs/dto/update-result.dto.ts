import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength, IsInt, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { ResultStatus } from '@prisma/client';

export class UpdateResultDto {
  @ApiProperty({ enum: ResultStatus })
  @IsEnum(ResultStatus)
  status!: ResultStatus;

  @ApiProperty({ required: false, description: 'Notes or comments about the result' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  @Transform(({ value }: { value: string }) => value?.trim())
  notes?: string;

  @ApiProperty({ required: false, description: 'Assignee user UUID' })
  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @ApiProperty({ required: false, description: 'Duration in seconds' })
  @IsOptional()
  @IsInt()
  @Min(0)
  duration?: number;
}
