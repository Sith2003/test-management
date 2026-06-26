import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsArray,
  IsUUID,
  ArrayMinSize,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateTestRunDto {
  @ApiProperty({ example: 'Sprint 5 Regression Run' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  @Transform(({ value }: { value: string }) => value?.trim())
  name!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @Transform(({ value }: { value: string }) => value?.trim())
  description?: string;

  @ApiProperty({
    type: [String],
    description: 'Array of test case UUIDs to include in this run',
    example: ['uuid1', 'uuid2'],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one test case is required' })
  @IsUUID('all', { each: true })
  testCaseIds!: string[];

  @ApiProperty({ required: false, example: 'Sprint 5' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }: { value: string }) => value?.trim())
  sprint?: string;

  @ApiProperty({ required: false, example: '1.4.2' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }: { value: string }) => value?.trim())
  version?: string;

  @ApiProperty({ required: false, description: 'UUID of an existing test plan to link this run to' })
  @IsOptional()
  @IsUUID()
  planId?: string;
}
