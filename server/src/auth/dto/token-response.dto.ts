import { ApiProperty } from '@nestjs/swagger';

export class UserDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  role!: string;

  @ApiProperty()
  createdAt!: Date;
}

export class TokenResponseDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty({ type: UserDto })
  user!: UserDto;
}
