import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, MinLength, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { Priority } from '@prisma/client';

export class CreateRequirementDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(500)
  @Transform(({ value }: { value: string }) => value?.trim())
  title!: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString() @MaxLength(5000)
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString() @MaxLength(200)
  externalId?: string;

  @ApiProperty({ enum: Priority, required: false, default: 'MEDIUM' })
  @IsOptional() @IsEnum(Priority)
  priority?: Priority;
}
