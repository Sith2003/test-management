import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, MinLength, MaxLength, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CreateChecklistItemDto {
  @ApiProperty()
  @IsString() @MinLength(2) @MaxLength(500)
  @Transform(({ value }: { value: string }) => value?.trim())
  title!: string;

  @ApiProperty({ required: false, default: 0 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  order?: number;
}
