import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateProfileDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Transform(({ value }: { value: string }) => value?.trim())
  name!: string;
}
