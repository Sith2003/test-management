import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, MinLength, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateUatSessionDto {
  @ApiProperty()
  @IsString() @MinLength(2) @MaxLength(500)
  @Transform(({ value }: { value: string }) => value?.trim())
  name!: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString() @MaxLength(100)
  version?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString() @MaxLength(500)
  environmentUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsDateString()
  uatStartDate?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsDateString()
  uatEndDate?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString() @MaxLength(200)
  supportContact?: string;
}
