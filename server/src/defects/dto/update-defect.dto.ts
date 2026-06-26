import { PartialType, ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsArray, IsString, IsUUID } from 'class-validator';
import { CreateDefectDto } from './create-defect.dto';

export class UpdateDefectDto extends PartialType(CreateDefectDto) {
  @ApiProperty({ type: [String], required: false, description: 'Array of attachment URLs' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachmentUrls?: string[];

  @ApiProperty({ required: false, description: 'UUID of the linked test result' })
  @IsOptional()
  @IsUUID()
  testResultId?: string;
}
