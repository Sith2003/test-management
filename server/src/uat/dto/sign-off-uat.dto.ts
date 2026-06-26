import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export enum SignOffDecision {
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

export class SignOffUatDto {
  @ApiProperty({ enum: SignOffDecision })
  @IsEnum(SignOffDecision)
  decision!: SignOffDecision;

  @ApiProperty({ required: false })
  @IsOptional() @IsString() @MaxLength(2000)
  note?: string;
}
