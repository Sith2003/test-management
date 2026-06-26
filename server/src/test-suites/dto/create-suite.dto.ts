import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsInt,
  Min,
  IsUUID,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CreateSuiteDto {
  @ApiProperty({ example: 'Authentication Tests' })
  @IsString()
  @MinLength(2, { message: 'Suite name must be at least 2 characters' })
  @MaxLength(200, { message: 'Suite name must not exceed 200 characters' })
  @Transform(({ value }: { value: string }) => value?.trim())
  name!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @Transform(({ value }: { value: string }) => value?.trim())
  description?: string;

  @ApiProperty({ required: false, description: 'Parent suite ID for nesting' })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiProperty({ required: false, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  order?: number;
}
