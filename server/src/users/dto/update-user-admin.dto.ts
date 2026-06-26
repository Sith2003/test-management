import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { UserRole } from '@prisma/client';

export class UpdateUserAdminDto {
  @ApiProperty({ enum: UserRole, required: false })
  @IsOptional() @IsEnum(UserRole)
  role?: UserRole;

  @ApiProperty({ required: false })
  @IsOptional() @IsBoolean()
  isActive?: boolean;
}
