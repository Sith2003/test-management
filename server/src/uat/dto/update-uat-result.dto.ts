import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { UatResultStatus } from '@prisma/client';

export class UpdateUatResultDto {
  @ApiProperty({ enum: UatResultStatus })
  @IsEnum(UatResultStatus)
  status!: UatResultStatus;

  @ApiProperty({ required: false })
  @IsOptional() @IsString() @MaxLength(2000)
  actualResult?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString() @MaxLength(500)
  evidenceUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString() @MaxLength(2000)
  comments?: string;
}
