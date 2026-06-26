import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID } from 'class-validator';

export class AddUatCasesDto {
  @ApiProperty({ type: [String] })
  @IsArray() @IsUUID(undefined, { each: true })
  testCaseIds!: string[];
}
