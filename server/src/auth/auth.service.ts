import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { TokenResponseDto, UserDto } from './dto/token-response.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UserRole } from '@prisma/client';

interface JwtPayloadInput {
  sub: string;
  email: string;
  name: string;
  role: UserRole;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<TokenResponseDto> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        password: hashedPassword,
        role: dto.role ?? UserRole.QA,
      },
    });

    const tokens = this.generateTokens({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return {
      accessToken: tokens.accessToken,
      user: this.mapUserToDto(user),
    };
  }

  async login(dto: LoginDto): Promise<{ tokens: TokenPair; user: UserDto }> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = this.generateTokens({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return { tokens, user: this.mapUserToDto(user) };
  }

  async refreshTokens(refreshToken: string): Promise<TokenPair> {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not provided');
    }

    let payload: JwtPayloadInput & { iat?: number; exp?: number };
    try {
      payload = await this.jwtService.verifyAsync<JwtPayloadInput & { iat?: number; exp?: number }>(
        refreshToken,
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        },
      );
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return this.generateTokens({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
  }

  async getMe(userId: string): Promise<UserDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true, updatedAt: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.mapUserToDto(user);
  }

  private generateTokens(payload: JwtPayloadInput): TokenPair {
    const accessToken = this.jwtService.sign(
      { sub: payload.sub, email: payload.email, name: payload.name, role: payload.role },
      {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') ?? '15m',
      },
    );

    const refreshToken = this.jwtService.sign(
      { sub: payload.sub, email: payload.email, name: payload.name, role: payload.role },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d',
      },
    );

    return { accessToken, refreshToken };
  }

  private mapUserToDto(user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    createdAt?: Date;
  }): UserDto {
    const dto = new UserDto();
    dto.id = user.id;
    dto.email = user.email;
    dto.name = user.name;
    dto.role = user.role;
    dto.createdAt = user.createdAt ?? new Date();
    return dto;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { name: dto.name },
      select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true, updatedAt: true },
    });
    return user;
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isCurrentPasswordValid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    if (dto.newPassword === dto.currentPassword) {
      throw new BadRequestException('New password must be different from current password');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }

  validatePasswordStrength(password: string): void {
    if (password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters');
    }
  }
}
