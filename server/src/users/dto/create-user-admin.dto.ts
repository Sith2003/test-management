import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsEnum, IsOptional, MinLength, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { UserRole } from '@prisma/client';

export class CreateUserAdminDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @Transform(({ value }: { value: string }) => value?.trim().toLowerCase())
  email!: string;

  @ApiProperty({ example: 'สมชาย ใจดี' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Transform(({ value }: { value: string }) => value?.trim())
  name!: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @MinLength(6)
  @MaxLength(100)
  password!: string;

  @ApiProperty({ enum: UserRole, default: UserRole.QA, required: false })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
