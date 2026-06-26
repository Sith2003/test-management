import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength, MaxLength, IsInt, Min, IsUUID } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class UpdateSuiteDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  @Transform(({ value }: { value: string }) => value?.trim())
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @Transform(({ value }: { value: string }) => value?.trim())
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  order?: number;
}
