import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Req,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { TokenResponseDto } from './dto/token-response.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Public } from '../shared/decorators/public.decorator';
import { CurrentUser, JwtPayload } from '../shared/decorators/current-user.decorator';
import { RATE_LIMITS } from '../shared/constants/pagination.constants';

const REFRESH_TOKEN_COOKIE = 'refreshToken';
const COOKIE_MAX_AGE_7D = 7 * 24 * 60 * 60 * 1000;

@ApiTags('Authentication')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiResponse({ status: 201, description: 'User registered successfully', type: TokenResponseDto })
  @ApiResponse({ status: 409, description: 'Email already in use' })
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response): Promise<TokenResponseDto> {
    const result = await this.authService.register(dto);
    return result;
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: RATE_LIMITS.LOGIN_TTL, limit: RATE_LIMITS.LOGIN_LIMIT } })
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful', type: TokenResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<TokenResponseDto> {
    const { tokens, user } = await this.authService.login(dto);

    // Set httpOnly refresh token cookie
    res.cookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: COOKIE_MAX_AGE_7D,
      path: '/',
    });

    return { accessToken: tokens.accessToken, user };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth(REFRESH_TOKEN_COOKIE)
  @ApiOperation({ summary: 'Refresh access token using httpOnly cookie' })
  @ApiResponse({ status: 200, description: 'Tokens refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string }> {
    const refreshToken = (req.cookies as Record<string, string>)[REFRESH_TOKEN_COOKIE];
    const tokens = await this.authService.refreshTokens(refreshToken);

    res.cookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: COOKIE_MAX_AGE_7D,
      path: '/',
    });

    return { accessToken: tokens.accessToken };
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Logout and clear refresh token cookie' })
  @ApiResponse({ status: 204, description: 'Logged out successfully' })
  logout(@Res({ passthrough: true }) res: Response): void {
    res.clearCookie(REFRESH_TOKEN_COOKIE, { path: '/' });
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user' })
  @ApiResponse({ status: 200, description: 'Current user information' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  async me(@CurrentUser() user: JwtPayload) {
    return this.authService.getMe(user.id);
  }

  @Patch('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update own profile name' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  async updateProfile(@CurrentUser() user: JwtPayload, @Body() dto: UpdateProfileDto) {
    return this.authService.updateProfile(user.id, dto);
  }

  @Patch('change-password')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Change own password' })
  @ApiResponse({ status: 204, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Current password incorrect or same as new' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  async changePassword(@CurrentUser() user: JwtPayload, @Body() dto: ChangePasswordDto): Promise<void> {
    return this.authService.changePassword(user.id, dto);
  }
}
