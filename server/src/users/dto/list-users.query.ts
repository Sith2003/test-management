import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString, IsBoolean, IsInt, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { UserRole } from '@prisma/client';

export class ListUsersQuery {
  @ApiProperty({ required: false, default: 1 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number;

  @ApiProperty({ required: false, default: 20 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)
  limit?: number;

  @ApiProperty({ required: false })
  @IsOptional() @IsString()
  search?: string;

  @ApiProperty({ enum: UserRole, required: false })
  @IsOptional() @IsEnum(UserRole)
  role?: UserRole;

  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }: { value: string }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isActive?: boolean;
}
