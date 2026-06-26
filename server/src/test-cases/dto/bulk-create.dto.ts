import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateTestCaseDto } from './create-test-case.dto';

export class BulkCreateTestCasesDto {
  @ApiProperty({ type: [CreateTestCaseDto], description: 'Array of test cases to create (max 100)' })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one test case is required' })
  @ArrayMaxSize(100, { message: 'Cannot create more than 100 test cases at once' })
  @ValidateNested({ each: true })
  @Type(() => CreateTestCaseDto)
  testCases!: CreateTestCaseDto[];
}
