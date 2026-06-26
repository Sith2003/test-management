import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ReviewStatus } from '@prisma/client';
import { Transform } from 'class-transformer';

export class ReviewTestCaseDto {
  @ApiProperty({ enum: ReviewStatus, description: 'New review status' })
  @IsEnum(ReviewStatus)
  status!: ReviewStatus;

  @ApiProperty({ required: false, description: 'Required when rejecting; optional note when approving' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @Transform(({ value }: { value: string }) => value?.trim())
  comment?: string;
}
