# Security Guidelines
*OWASP Top 10 2021 Compliance for NestJS Applications*

## Overview
เอกสารนี้ระบุแนวทางความปลอดภัยที่ครอบคลุมสำหรับ NestJS applications โดยอ้างอิง OWASP Top 10 security risks และ best practices สำหรับ Node.js/TypeScript

---

## A01:2021 – Broken Access Control

### JWT Authentication with Passport.js

```typescript
// src/frameworks/auth/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  sub: string; // User ID
  email: string;
  role: string;
  iat: number;
  exp: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @Inject('UserRepository')
    private userRepository: UserRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
      algorithms: ['HS256'], // Specify allowed algorithms
    });
  }

  async validate(payload: JwtPayload) {
    // Verify user still exists and is active
    const user = await this.userRepository.findById(payload.sub);
    
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.isActive()) {
      throw new UnauthorizedException('User account is not active');
    }

    // Return user object to be attached to request
    return {
      id: user.getId(),
      email: user.getEmail(),
      role: user.getRole(),
    };
  }
}
```

### JWT Auth Guard
```typescript
// src/frameworks/auth/guards/jwt-auth.guard.ts
import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '@/shared/decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    if (err || !user) {
      throw err || new UnauthorizedException('Invalid or expired token');
    }
    return user;
  }
}
```

### Role-Based Access Control (RBAC)
```typescript
// src/frameworks/auth/guards/roles.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '@/shared/decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException('User not found in request');
    }

    const hasRole = requiredRoles.some((role) => user.role === role);

    if (!hasRole) {
      throw new ForbiddenException(
        `Insufficient permissions. Required: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
```

### Resource Ownership Verification
```typescript
// src/usecases/user/update-user.usecase.ts
import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';

@Injectable()
export class UpdateUserUseCase {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
  ) {}

  async execute(input: UpdateUserInput): Promise<User> {
    const targetUser = await this.userRepository.findById(input.id);
    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    const currentUser = await this.userRepository.findById(input.currentUserId);
    if (!currentUser) {
      throw new NotFoundException('Current user not found');
    }

    // Business rule: Users can only update their own profile unless they're admin
    if (input.id !== input.currentUserId && !currentUser.isAdmin()) {
      throw new ForbiddenException('Cannot modify other users data');
    }

    // Proceed with update
    targetUser.updateProfile(input.name);
    return this.userRepository.update(targetUser.getId(), targetUser);
  }
}
```

## A02:2021 – Cryptographic Failures

### Password Hashing with bcrypt
```typescript
// src/shared/utils/password.util.ts
import * as bcrypt from 'bcrypt';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PasswordService {
  private readonly saltRounds: number;

  constructor(private configService: ConfigService) {
    this.saltRounds = this.configService.get<number>('BCRYPT_ROUNDS') || 10;
  }

  async hashPassword(password: string): Promise<string> {
    // Validate password strength before hashing
    this.validatePasswordStrength(password);
    
    const salt = await bcrypt.genSalt(this.saltRounds);
    return bcrypt.hash(password, salt);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  private validatePasswordStrength(password: string): void {
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    // Check for complexity
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!(hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar)) {
      throw new Error(
        'Password must contain uppercase, lowercase, number, and special character',
      );
    }
  }
}
```

### JWT Token Security
```typescript
// src/frameworks/auth/services/token.service.ts
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export interface TokenPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class TokenService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  generateAccessToken(payload: TokenPayload): string {
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_ACCESS_TOKEN_EXPIRY') || '15m',
      issuer: this.configService.get<string>('JWT_ISSUER'),
      algorithm: 'HS256',
    });
  }

  generateRefreshToken(payload: TokenPayload): string {
    return this.jwtService.sign(
      { sub: payload.sub },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_TOKEN_EXPIRY') || '7d',
        issuer: this.configService.get<string>('JWT_ISSUER'),
        algorithm: 'HS256',
      },
    );
  }

  verifyAccessToken(token: string): TokenPayload {
    return this.jwtService.verify(token, {
      secret: this.configService.get<string>('JWT_SECRET'),
      algorithms: ['HS256'],
    });
  }

  verifyRefreshToken(token: string): { sub: string } {
    return this.jwtService.verify(token, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      algorithms: ['HS256'],
    });
  }
}
```

### Sensitive Data Encryption
```typescript
// src/shared/utils/encryption.util.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly encryptionKey: Buffer;

  constructor(private configService: ConfigService) {
    const key = this.configService.get<string>('ENCRYPTION_KEY');
    if (!key || key.length !== 64) {
      throw new Error('ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
    }
    this.encryptionKey = Buffer.from(key, 'hex');
  }

  encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Return: iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  decrypt(ciphertext: string): string {
    const parts = ciphertext.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid ciphertext format');
    }

    const [ivHex, authTagHex, encrypted] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
```

## A03:2021 – Injection

### SQL Injection Prevention with Prisma
```typescript
// Prisma automatically prevents SQL injection through parameterized queries
// ✅ Good - Prisma handles this safely
async findByEmail(email: string): Promise<User | null> {
  const user = await this.prisma.user.findUnique({
    where: { email }, // Safe - parameterized
  });
  return user ? this.toDomain(user) : null;
}

// ✅ Good - Complex queries are still safe
async searchUsers(searchTerm: string): Promise<User[]> {
  const users = await this.prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { email: { contains: searchTerm, mode: 'insensitive' } },
      ],
    },
  });
  return users.map(this.toDomain);
}

// ❌ Bad - Never use raw SQL unless absolutely necessary
// If you must use raw SQL, always use parameterized queries
async rawQuery(email: string): Promise<User[]> {
  // ❌ NEVER DO THIS
  // const users = await this.prisma.$queryRaw`SELECT * FROM users WHERE email = '${email}'`;
  
  // ✅ Use this instead
  const users = await this.prisma.$queryRaw`SELECT * FROM users WHERE email = ${email}`;
  return users;
}
```

### Input Validation with class-validator
```typescript
// src/adapters/controllers/dto/create-user.dto.ts
import {
  IsString,
  IsEmail,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Matches,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { UserRole } from '@/entities/user.entity';

export class CreateUserDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  @Transform(({ value }) => value?.trim()) // Sanitize input
  name: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(255)
  @Transform(({ value }) => value?.toLowerCase().trim()) // Normalize email
  email: string;

  @ApiProperty({ example: 'StrongPass123!' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(128)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    {
      message: 'Password must contain uppercase, lowercase, number, and special character',
    },
  )
  password: string;

  @ApiProperty({ enum: UserRole })
  @IsEnum(UserRole)
  role: UserRole;
}
```

### XSS Prevention
```typescript
// src/shared/utils/sanitize.util.ts
import * as sanitizeHtml from 'sanitize-html';

export class SanitizeService {
  // For plain text - strip all HTML
  static sanitizeText(input: string): string {
    return sanitizeHtml(input, {
      allowedTags: [],
      allowedAttributes: {},
    });
  }

  // For rich text - allow safe HTML only
  static sanitizeHtml(input: string): string {
    return sanitizeHtml(input, {
      allowedTags: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
      allowedAttributes: {
        a: ['href', 'target'],
      },
      allowedSchemes: ['http', 'https', 'mailto'],
    });
  }

  // Remove potentially dangerous characters for filenames
  static sanitizeFilename(filename: string): string {
    return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  }
}
```

## A04:2021 – Insecure Design

### Rate Limiting Implementation
```typescript
// src/app.module.ts
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60, // seconds
      limit: 100, // requests per TTL
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}

// Custom rate limiting for auth endpoints
// src/frameworks/auth/guards/auth-throttle.guard.ts
import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class AuthThrottleGuard extends ThrottlerGuard {
  protected getTracker(req: Record<string, any>): string {
    // Track by IP and email for login attempts
    return `${req.ip}-${req.body?.email || ''}`;
  }
}

// Usage in controller
@Controller('auth')
export class AuthController {
  @Post('login')
  @UseGuards(AuthThrottleGuard)
  @Throttle(5, 900) // 5 attempts per 15 minutes
  async login(@Body() loginDto: LoginDto) {
    // ...
  }
}
```

### Account Lockout
```typescript
// src/usecases/auth/login.usecase.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class LoginUseCase {
  private readonly maxAttempts: number;
  private readonly lockoutDuration: number;

  constructor(
    @Inject('UserRepository')
    private userRepository: UserRepository,
    @Inject('REDIS_CLIENT')
    private redis: Redis,
    private passwordService: PasswordService,
    private tokenService: TokenService,
    private configService: ConfigService,
  ) {
    this.maxAttempts = this.configService.get<number>('MAX_LOGIN_ATTEMPTS') || 5;
    this.lockoutDuration = this.configService.get<number>('LOCKOUT_DURATION') || 900; // 15 minutes
  }

  async execute(input: LoginInput): Promise<LoginResult> {
    const lockKey = `login_attempts:${input.email}`;

    // Check if account is locked
    const attempts = await this.redis.get(lockKey);
    if (attempts && parseInt(attempts) >= this.maxAttempts) {
      const ttl = await this.redis.ttl(lockKey);
      throw new UnauthorizedException(
        `Account locked. Try again in ${Math.ceil(ttl / 60)} minutes`,
      );
    }

    // Find user
    const user = await this.userRepository.findByEmail(input.email);
    if (!user) {
      await this.recordFailedAttempt(lockKey);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await this.passwordService.verifyPassword(
      input.password,
      user.getPassword(),
    );

    if (!isPasswordValid) {
      await this.recordFailedAttempt(lockKey);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive()) {
      throw new UnauthorizedException('Account is not active');
    }

    // Clear failed attempts on successful login
    await this.redis.del(lockKey);

    // Generate tokens
    const accessToken = this.tokenService.generateAccessToken({
      sub: user.getId(),
      email: user.getEmail(),
      role: user.getRole(),
    });

    const refreshToken = this.tokenService.generateRefreshToken({
      sub: user.getId(),
      email: user.getEmail(),
      role: user.getRole(),
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.getId(),
        email: user.getEmail(),
        name: user.getName(),
        role: user.getRole(),
      },
    };
  }

  private async recordFailedAttempt(key: string): Promise<void> {
    const attempts = await this.redis.incr(key);
    if (attempts === 1) {
      await this.redis.expire(key, this.lockoutDuration);
    }
  }
}
```

## A05:2021 – Security Misconfiguration

### Helmet Security Headers
```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security headers with Helmet
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      frameguard: {
        action: 'deny',
      },
      noSniff: true,
      xssFilter: true,
    }),
  );

  await app.listen(3000);
}
bootstrap();
```

### CORS Configuration
```typescript
// src/main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS configuration
  app.enableCors({
    origin: (origin, callback) => {
      const allowedOrigins = process.env.CORS_ORIGINS?.split(',') || [];
      
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    exposedHeaders: ['X-Request-ID'],
    maxAge: 3600,
  });

  await app.listen(3000);
}
```

### Environment Configuration Validation
```typescript
// src/frameworks/config/configuration.ts
import { registerAs } from '@nestjs/config';
import { plainToClass } from 'class-transformer';
import { IsString, IsInt, IsUrl, validateSync, MinLength, IsEnum } from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment;

  @IsInt()
  PORT: number;

  @IsUrl({ require_tld: false })
  DATABASE_URL: string;

  @IsString()
  @MinLength(32)
  JWT_SECRET: string;

  @IsString()
  @MinLength(32)
  JWT_REFRESH_SECRET: string;

  @IsString()
  @MinLength(64)
  ENCRYPTION_KEY: string;

  @IsInt()
  BCRYPT_ROUNDS: number;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToClass(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfig;
}

// Usage in app.module.ts
@Module({
  imports: [
    ConfigModule.forRoot({
      validate,
      isGlobal: true,
    }),
  ],
})
export class AppModule {}
```

## A06:2021 – Vulnerable and Outdated Components

### Dependency Management
```json
// package.json
{
  "name": "argo-identity-api",
  "version": "1.0.0",
  "scripts": {
    "audit": "npm audit",
    "audit:fix": "npm audit fix",
    "update:check": "npm outdated",
    "update:interactive": "npx npm-check-updates -i"
  },
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/passport": "^10.0.0",
    "@nestjs/jwt": "^10.0.0",
    "@prisma/client": "^5.0.0",
    "bcrypt": "^5.1.0",
    "helmet": "^7.0.0",
    "passport-jwt": "^4.0.1"
  }
}
```

### Security Scanning
```yaml
# .github/workflows/security-scan.yml
name: Security Scan

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
  schedule:
    - cron: '0 0 * * 0' # Weekly scan

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run npm audit
        run: npm audit --audit-level=moderate
      
      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
      
      - name: Run OWASP Dependency Check
        uses: dependency-check/Dependency-Check_Action@main
        with:
          project: 'argo-identity-api'
          path: '.'
          format: 'HTML'
```

## A07:2021 – Identification and Authentication Failures

### Multi-Factor Authentication (Placeholder)
```typescript
// src/usecases/auth/verify-mfa.usecase.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as speakeasy from 'speakeasy';

@Injectable()
export class VerifyMfaUseCase {
  constructor(
    @Inject('UserRepository')
    private userRepository: UserRepository,
  ) {}

  async execute(input: VerifyMfaInput): Promise<boolean> {
    const user = await this.userRepository.findById(input.userId);
    
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const mfaSecret = user.getMfaSecret();
    if (!mfaSecret) {
      throw new UnauthorizedException('MFA not enabled');
    }

    // Verify TOTP token
    const verified = speakeasy.totp.verify({
      secret: mfaSecret,
      encoding: 'base32',
      token: input.token,
      window: 2, // Allow 2 time steps before/after for clock skew
    });

    if (!verified) {
      throw new UnauthorizedException('Invalid MFA token');
    }

    return true;
  }
}
```

### Session Management
```typescript
// src/frameworks/auth/strategies/refresh-token.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    private configService: ConfigService,
    @Inject('SessionRepository')
    private sessionRepository: SessionRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_REFRESH_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(req: any, payload: any) {
    const refreshToken = req.body.refreshToken;

    // Verify refresh token exists in database
    const session = await this.sessionRepository.findByRefreshToken(refreshToken);
    
    if (!session || session.isExpired()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return { userId: payload.sub, refreshToken };
  }
}
```

## A08:2021 – Software and Data Integrity Failures

### Audit Logging
```typescript
// src/shared/interceptors/audit-log.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(
    @Inject('AuditLogRepository')
    private auditLogRepository: AuditLogRepository,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { user, method, url, body, ip, headers } = request;
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: (data) => {
          if (user && this.shouldAudit(method, url)) {
            this.auditLogRepository.create({
              userId: user.id,
              action: `${method} ${url}`,
              resourceType: this.extractResourceType(url),
              ipAddress: ip,
              userAgent: headers['user-agent'],
              details: {
                method,
                url,
                statusCode: 200,
                duration: Date.now() - startTime,
              },
            });
          }
        },
        error: (error) => {
          if (user) {
            this.auditLogRepository.create({
              userId: user.id,
              action: `${method} ${url}`,
              resourceType: this.extractResourceType(url),
              ipAddress: ip,
              userAgent: headers['user-agent'],
              details: {
                method,
                url,
                statusCode: error.status || 500,
                error: error.message,
                duration: Date.now() - startTime,
              },
            });
          }
        },
      }),
    );
  }

  private shouldAudit(method: string, url: string): boolean {
    // Don't audit health checks and metrics
    if (url.includes('/health') || url.includes('/metrics')) {
      return false;
    }
    // Audit all write operations
    return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
  }

  private extractResourceType(url: string): string {
    const parts = url.split('/').filter(Boolean);
    return parts[parts.length - 1] || 'unknown';
  }
}
```

## A09:2021 – Security Logging and Monitoring Failures

### Structured Logging with Winston
```typescript
// src/frameworks/logging/logger.service.ts
import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import * as winston from 'winston';

@Injectable()
export class LoggerService implements NestLoggerService {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      defaultMeta: {
        service: 'argo-identity-api',
        environment: process.env.NODE_ENV,
      },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
          ),
        }),
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
        }),
        new winston.transports.File({
          filename: 'logs/combined.log',
        }),
      ],
    });
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { trace, context });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context });
  }

  // Security-specific logging
  logSecurityEvent(event: {
    type: string;
    userId?: string;
    ipAddress: string;
    details: any;
  }) {
    this.logger.warn('Security Event', {
      ...event,
      timestamp: new Date().toISOString(),
    });
  }

  logFailedLogin(email: string, ipAddress: string, reason: string) {
    this.logSecurityEvent({
      type: 'FAILED_LOGIN',
      userId: email,
      ipAddress,
      details: { reason },
    });
  }

  logAccountLockout(email: string, ipAddress: string, duration: number) {
    this.logSecurityEvent({
      type: 'ACCOUNT_LOCKOUT',
      userId: email,
      ipAddress,
      details: { lockoutDuration: duration },
    });
  }

  logUnauthorizedAccess(userId: string, resource: string, ipAddress: string) {
    this.logSecurityEvent({
      type: 'UNAUTHORIZED_ACCESS',
      userId,
      ipAddress,
      details: { resource },
    });
  }
}
```

## A10:2021 – Server-Side Request Forgery (SSRF)

### HTTP Client Security
```typescript
// src/shared/services/http-client.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import * as validator from 'validator';

@Injectable()
export class SecureHttpClientService {
  private readonly allowedDomains: string[];

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.allowedDomains = this.configService.get<string>('ALLOWED_DOMAINS')?.split(',') || [];
  }

  async get(url: string): Promise<any> {
    this.validateUrl(url);
    const response = await firstValueFrom(
      this.httpService.get(url, {
        timeout: 5000,
        maxRedirects: 0, // Prevent redirect attacks
      }),
    );
    return response.data;
  }

  async post(url: string, data: any): Promise<any> {
    this.validateUrl(url);
    const response = await firstValueFrom(
      this.httpService.post(url, data, {
        timeout: 5000,
        maxRedirects: 0,
      }),
    );
    return response.data;
  }

  private validateUrl(url: string): void {
    // Validate URL format
    if (!validator.isURL(url, { protocols: ['http', 'https'], require_protocol: true })) {
      throw new BadRequestException('Invalid URL format');
    }

    const parsedUrl = new URL(url);

    // Block private IP ranges
    const hostname = parsedUrl.hostname;
    if (this.isPrivateIP(hostname)) {
      throw new BadRequestException('Access to private IP addresses is not allowed');
    }

    // Block localhost
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0') {
      throw new BadRequestException('Access to localhost is not allowed');
    }

    // Whitelist domains (if configured)
    if (this.allowedDomains.length > 0) {
      const isAllowed = this.allowedDomains.some((domain) =>
        hostname.endsWith(domain),
      );
      if (!isAllowed) {
        throw new BadRequestException(`Domain ${hostname} is not allowed`);
      }
    }
  }

  private isPrivateIP(hostname: string): boolean {
    // Check for private IP ranges
    const privateRanges = [
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^169\.254\./, // Link-local
      /^127\./, // Loopback
    ];

    return privateRanges.some((range) => range.test(hostname));
  }
}
```

## Security Checklist

### Pre-deployment Security Checklist
- [ ] JWT secrets are strong (min 32 characters) และ unique
- [ ] Database credentials are secure และไม่ hard-coded
- [ ] All environment variables are validated
- [ ] Rate limiting is enabled และ configured properly
- [ ] Security headers (Helmet) are configured
- [ ] CORS policies are restrictive
- [ ] Input validation is comprehensive (all DTOs)
- [ ] SQL injection prevention (Prisma parameterized queries)
- [ ] Password hashing uses bcrypt with appropriate rounds (10-12)
- [ ] Audit logging is enabled สำหรับ critical operations
- [ ] Error messages don't expose sensitive information
- [ ] HTTPS is enforced ใน production
- [ ] Dependencies are up to date และ scanned
- [ ] Security scanning tools are integrated (Snyk, npm audit)

### Runtime Security Monitoring
- [ ] Failed login attempts are monitored และ logged
- [ ] Account lockouts are logged
- [ ] Unusual API usage patterns are detected
- [ ] Unauthorized access attempts are tracked และ alerted
- [ ] Rate limit violations are monitored
- [ ] Performance anomalies are detected
- [ ] Error rates are tracked
- [ ] Security logs are regularly reviewed

### Secure Configuration Management
```typescript
// src/frameworks/config/security-config.ts
export interface SecurityConfig {
  jwt: {
    secret: string;
    refreshSecret: string;
    accessTokenExpiry: string;
    refreshTokenExpiry: string;
  };
  bcrypt: {
    rounds: number;
  };
  rateLimit: {
    ttl: number;
    limit: number;
  };
  cors: {
    origins: string[];
    credentials: boolean;
  };
  encryption: {
    key: string;
  };
}

export const loadSecurityConfig = (): SecurityConfig => {
  // Validate all security-critical env vars exist
  const requiredVars = [
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'ENCRYPTION_KEY',
  ];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      throw new Error(`Required environment variable ${varName} is not set`);
    }
  }

  return {
    jwt: {
      secret: process.env.JWT_SECRET!,
      refreshSecret: process.env.JWT_REFRESH_SECRET!,
      accessTokenExpiry: process.env.JWT_ACCESS_TOKEN_EXPIRY || '15m',
      refreshTokenExpiry: process.env.JWT_REFRESH_TOKEN_EXPIRY || '7d',
    },
    bcrypt: {
      rounds: parseInt(process.env.BCRYPT_ROUNDS || '10'),
    },
    rateLimit: {
      ttl: parseInt(process.env.RATE_LIMIT_TTL || '60'),
      limit: parseInt(process.env.RATE_LIMIT_MAX || '100'),
    },
    cors: {
      origins: process.env.CORS_ORIGINS?.split(',') || [],
      credentials: process.env.CORS_CREDENTIALS === 'true',
    },
    encryption: {
      key: process.env.ENCRYPTION_KEY!,
    },
  };
};
```

Remember: Security คือ ongoing process ไม่ใช่ one-time implementation ต้อง review และ update security measures อย่างสม่ำเสมอตาม threats ที่เปลี่ยนแปลงไป
