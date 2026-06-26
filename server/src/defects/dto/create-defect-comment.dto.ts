import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';

export class CreateDefectCommentDto {
  @ApiProperty({ example: 'Reproduced on staging — see attached screenshot.', minLength: 1, maxLength: 2000 })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content!: string;
}
