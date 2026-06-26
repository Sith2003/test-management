import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsEnum,
  IsArray,
  IsInt,
  Min,
  ValidateNested,
  IsUUID,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import {
  Priority,
  CaseStatus,
  Severity,
  TestType,
  TestEnvironment,
  AutomationStatus,
  ReviewStatus,
  PlatformPortal,
  UrgencyFlag,
} from '@prisma/client';

export class CreateTestStepDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  order!: number;

  @ApiProperty({ example: 'Navigate to the login page' })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  @Transform(({ value }: { value: string }) => value?.trim())
  action!: string;

  @ApiProperty({ required: false, example: 'Login page is displayed' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Transform(({ value }: { value: string }) => value?.trim())
  expectedResult?: string;
}

export class CreateTestCaseDto {
  @ApiProperty({ example: 'User Login with valid credentials' })
  @IsString()
  @MinLength(2)
  @MaxLength(500)
  @Transform(({ value }: { value: string }) => value?.trim())
  title!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  @Transform(({ value }: { value: string }) => value?.trim())
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Transform(({ value }: { value: string }) => value?.trim())
  preconditions?: string;

  @ApiProperty({ required: false, description: 'Test scenario name for grouping' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }: { value: string }) => value?.trim())
  scenario?: string;

  @ApiProperty({ required: false, description: 'Suite UUID' })
  @IsOptional()
  @IsUUID()
  suiteId?: string;

  @ApiProperty({ enum: Priority, required: false, default: Priority.MEDIUM })
  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @ApiProperty({ enum: CaseStatus, required: false, default: CaseStatus.ACTIVE })
  @IsOptional()
  @IsEnum(CaseStatus)
  status?: CaseStatus;

  @ApiProperty({ type: [String], required: false, example: ['smoke', 'regression'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  tags?: string[];

  @ApiProperty({ type: [CreateTestStepDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTestStepDto)
  steps?: CreateTestStepDto[];

  @ApiProperty({ enum: Severity, required: false })
  @IsOptional()
  @IsEnum(Severity)
  severity?: Severity;

  @ApiProperty({ enum: TestType, required: false })
  @IsOptional()
  @IsEnum(TestType)
  testType?: TestType;

  @ApiProperty({ enum: TestEnvironment, required: false })
  @IsOptional()
  @IsEnum(TestEnvironment)
  testEnvironment?: TestEnvironment;

  @ApiProperty({ enum: AutomationStatus, required: false })
  @IsOptional()
  @IsEnum(AutomationStatus)
  automationStatus?: AutomationStatus;

  @ApiProperty({ enum: ReviewStatus, required: false })
  @IsOptional()
  @IsEnum(ReviewStatus)
  reviewStatus?: ReviewStatus;

  @ApiProperty({ enum: PlatformPortal, required: false })
  @IsOptional()
  @IsEnum(PlatformPortal)
  platformPortal?: PlatformPortal;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  requirementId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(({ value }: { value: string }) => value?.trim())
  assignedDeveloper?: string;

  @ApiProperty({ enum: UrgencyFlag, required: false })
  @IsOptional()
  @IsEnum(UrgencyFlag)
  urgencyFlag?: UrgencyFlag;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  @Transform(({ value }: { value: string }) => value?.trim())
  testData?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Transform(({ value }: { value: string }) => value?.trim())
  expectedResult?: string;
}
