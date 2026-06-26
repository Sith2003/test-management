import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @Transform(({ value }: { value: string }) => value?.toLowerCase().trim())
  email!: string;

  @ApiProperty({ example: 'SecurePass@123' })
  @IsString()
  @MinLength(1, { message: 'Password is required' })
  @MaxLength(100, { message: 'Password must not exceed 100 characters' })
  password!: string;
}
