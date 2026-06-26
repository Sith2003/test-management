import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
  IsUrl,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateProjectDto {
  @ApiProperty({ example: 'My Project', description: 'Project name' })
  @IsString()
  @MinLength(2, { message: 'Project name must be at least 2 characters' })
  @MaxLength(100, { message: 'Project name must not exceed 100 characters' })
  @Transform(({ value }: { value: string }) => value?.trim())
  name!: string;

  @ApiProperty({ example: 'A description of the project', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Description must not exceed 500 characters' })
  @Transform(({ value }: { value: string }) => value?.trim())
  description?: string;

  @ApiProperty({
    example: 'PROJ',
    description: 'Unique project key (2-10 uppercase alphanumeric)',
  })
  @IsString()
  @MinLength(2, { message: 'Project key must be at least 2 characters' })
  @MaxLength(10, { message: 'Project key must not exceed 10 characters' })
  @Matches(/^[A-Z0-9]+$/, { message: 'Project key must contain only uppercase letters and numbers' })
  @Transform(({ value }: { value: string }) => value?.trim().toUpperCase())
  key!: string;

  @ApiProperty({ example: 'https://...', required: false })
  @IsOptional()
  @IsString()
  logoUrl?: string;
}
