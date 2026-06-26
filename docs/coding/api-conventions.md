# API Conventions

## RESTful URL Structure

### Base Pattern
```
/api/v1/<resource>/<identifier>/<sub-resource>

Examples:
/api/v1/users/123
/api/v1/users/123/roles
/api/v1/roles/456/permissions
/api/v1/audit-logs?user_id=123
```

### HTTP Methods & Endpoints

#### Collections (Always Plural)
```
GET    /api/v1/users              # List all users with pagination
POST   /api/v1/users              # Create a new user
GET    /api/v1/users/:id          # Get specific user by ID
PUT    /api/v1/users/:id          # Replace entire user (rarely used)
PATCH  /api/v1/users/:id          # Partial update user
DELETE /api/v1/users/:id          # Delete user (soft delete)
```

#### Nested Resources
```
GET    /api/v1/users/:id/roles              # List user's roles
POST   /api/v1/users/:id/roles              # Assign role to user
DELETE /api/v1/users/:id/roles/:roleId      # Remove role from user

GET    /api/v1/roles/:id/permissions        # List role's permissions
POST   /api/v1/roles/:id/permissions        # Add permission to role
DELETE /api/v1/roles/:id/permissions/:permId # Remove permission from role
```

#### Actions/Operations
Use verbs for non-CRUD operations:
```
POST   /api/v1/users/:id/activate           # Activate user account
POST   /api/v1/users/:id/deactivate         # Deactivate user account
POST   /api/v1/users/:id/reset-password     # Reset user password
POST   /api/v1/users/:id/change-password    # Change user password

POST   /api/v1/auth/login                   # User login
POST   /api/v1/auth/logout                  # User logout
POST   /api/v1/auth/refresh                 # Refresh JWT token
POST   /api/v1/auth/verify-email            # Verify email address

GET    /api/v1/health                       # Health check
GET    /api/v1/metrics                      # Application metrics (admin only)
GET    /api/v1/audit-logs                   # System audit logs
```

## NestJS Controller Organization

### Controller Structure
```typescript
// src/adapters/controllers/user.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/frameworks/auth/jwt-auth.guard';
import { RolesGuard } from '@/frameworks/auth/roles.guard';
import { Roles } from '@/shared/decorators/roles.decorator';
import { CurrentUser } from '@/shared/decorators/current-user.decorator';
import { CreateUserUseCase } from '@/usecases/user/create-user.usecase';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponse } from './dto/user-response.dto';
import { ListUsersQuery } from './dto/list-users.query';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UserController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly getUserUseCase: GetUserUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly listUsersUseCase: ListUsersUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase,
    private readonly activateUserUseCase: ActivateUserUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('admin')
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    type: UserResponse,
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async createUser(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser('id') currentUserId: string,
  ): Promise<UserResponse> {
    const user = await this.createUserUseCase.execute(createUserDto);
    return this.toResponse(user);
  }

  @Get()
  @Roles('admin', 'moderator')
  @ApiOperation({ summary: 'List users with pagination and filters' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'role', required: false, enum: ['admin', 'user', 'moderator'] })
  async listUsers(@Query() query: ListUsersQuery) {
    const result = await this.listUsersUseCase.execute({
      page: query.page || 1,
      limit: query.limit || 20,
      search: query.search,
      role: query.role,
    });

    return {
      data: result.users.map((user) => this.toResponse(user)),
      pagination: {
        page: result.page,
        limit: query.limit || 20,
        total: result.total,
        totalPages: result.totalPages,
        hasNextPage: result.page < result.totalPages,
        hasPreviousPage: result.page > 1,
      },
      meta: {
        timestamp: new Date().toISOString(),
        resultCount: result.users.length,
      },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'User found', type: UserResponse })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUser(@Param('id', ParseUUIDPipe) id: string): Promise<UserResponse> {
    const user = await this.getUserUseCase.execute(id);
    return this.toResponse(user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async updateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser('id') currentUserId: string,
  ): Promise<UserResponse> {
    const user = await this.updateUserUseCase.execute({
      id,
      ...updateUserDto,
      currentUserId,
    });
    return this.toResponse(user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('admin')
  @ApiOperation({ summary: 'Delete user (soft delete)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async deleteUser(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') currentUserId: string,
  ): Promise<void> {
    await this.deleteUserUseCase.execute({
      id,
      deletedBy: currentUserId,
      reason: 'Deleted by admin',
    });
  }

  @Post(':id/activate')
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  @ApiOperation({ summary: 'Activate user account' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async activateUser(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UserResponse> {
    const user = await this.activateUserUseCase.execute(id);
    return this.toResponse(user);
  }

  private toResponse(user: any): UserResponse {
    return {
      id: user.getId(),
      name: user.getName(),
      email: user.getEmail(),
      role: user.getRole(),
      status: user.getStatus(),
      createdAt: user.getCreatedAt(),
      updatedAt: user.getUpdatedAt(),
    };
  }
}
```

### Module Organization
```
src/adapters/controllers/
├── user/
│   ├── user.controller.ts
│   ├── user.module.ts
│   └── dto/
│       ├── create-user.dto.ts
│       ├── update-user.dto.ts
│       ├── list-users.query.ts
│       └── user-response.dto.ts
├── auth/
│   ├── auth.controller.ts
│   ├── auth.module.ts
│   └── dto/
│       ├── login.dto.ts
│       ├── register.dto.ts
│       └── token-response.dto.ts
└── health/
    ├── health.controller.ts
    └── health.module.ts
```

## MANDATORY Soft Limits (Security & Performance)

### Critical Requirements
**ALL collection endpoints MUST implement these constraints to prevent:**
- **DoS attacks** through large requests
- **Performance degradation** from expensive queries
- **Resource exhaustion** on database and server
- **Poor user experience** from slow responses

### Required Constraints
```typescript
// src/shared/constants/pagination.constants.ts
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  MIN_LIMIT: 1,
  MAX_PAGE: 10000,
} as const;

export const SEARCH = {
  MAX_LENGTH: 100,
  MIN_LENGTH: 2,
} as const;

export const QUERY_TIMEOUT = 30000; // 30 seconds

export const RATE_LIMITS = {
  READ: {
    TTL: 60, // seconds
    LIMIT: 100, // requests
  },
  WRITE: {
    TTL: 60,
    LIMIT: 20,
  },
  SEARCH: {
    TTL: 60,
    LIMIT: 50,
  },
  AUTH: {
    TTL: 900, // 15 minutes
    LIMIT: 5, // login attempts
  },
} as const;
```

### Implementation Example with NestJS
```typescript
// src/adapters/controllers/dto/list-users.query.ts
import {
  IsOptional,
  IsInt,
  Min,
  Max,
  IsString,
  MaxLength,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@/entities/user.entity';
import { PAGINATION, SEARCH } from '@/shared/constants/pagination.constants';

export class ListUsersQuery {
  @ApiPropertyOptional({
    default: PAGINATION.DEFAULT_PAGE,
    minimum: 1,
    maximum: PAGINATION.MAX_PAGE,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(PAGINATION.MAX_PAGE)
  @IsOptional()
  page?: number = PAGINATION.DEFAULT_PAGE;

  @ApiPropertyOptional({
    default: PAGINATION.DEFAULT_LIMIT,
    minimum: PAGINATION.MIN_LIMIT,
    maximum: PAGINATION.MAX_LIMIT,
  })
  @Type(() => Number)
  @IsInt()
  @Min(PAGINATION.MIN_LIMIT)
  @Max(PAGINATION.MAX_LIMIT)
  @IsOptional()
  limit?: number = PAGINATION.DEFAULT_LIMIT;

  @ApiPropertyOptional({ maxLength: SEARCH.MAX_LENGTH })
  @IsString()
  @MaxLength(SEARCH.MAX_LENGTH)
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ enum: UserRole })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  @IsString()
  @IsOptional()
  order?: 'asc' | 'desc' = 'desc';
}
```

## Query Parameters

### Standard Parameters
```typescript
// Pagination (MANDATORY for all collection endpoints)
page: number          // Page number (1-based, default: 1, max: 10000)
limit: number         // Items per page (default: 20, max: 100)

// Sorting
sortBy: string        // Field to sort by (validated against whitelist)
order: 'asc' | 'desc' // Sort direction (default: 'desc')

// Filtering
status: string        // Filter by status (active, inactive, etc.)
role: string          // Filter by user role
search: string        // Search query (max 100 characters)

// Date filtering (ISO 8601 format)
createdAfter: string   // ISO date string (2024-01-01T00:00:00Z)
createdBefore: string  // ISO date string (2024-12-31T23:59:59Z)
updatedAfter: string
updatedBefore: string

// Inclusion (Limited to prevent N+1 queries)
include: string       // Include relations: "roles", "permissions" (comma-separated)
fields: string        // Select specific fields: "id,name,email" (comma-separated)
```

### Example Queries
```bash
# Basic pagination
GET /api/v1/users?page=2&limit=50

# Search with filters
GET /api/v1/users?search=john&role=admin&status=active&limit=25

# Sorting
GET /api/v1/users?sortBy=createdAt&order=asc&limit=10

# Date range filtering
GET /api/v1/users?createdAfter=2024-01-01T00:00:00Z&createdBefore=2024-12-31T23:59:59Z

# Include relations (limited)
GET /api/v1/users?include=roles&limit=20

# Complex filtering
GET /api/v1/audit-logs?userId=123&action=login&createdAfter=2024-01-01T00:00:00Z&sortBy=createdAt&order=desc
```

## Response Format Standards

### Success Response Structure
```typescript
// src/shared/types/api-response.types.ts
export interface ApiResponse<T> {
  data: T;
  meta?: ResponseMeta;
}

export interface CollectionResponse<T> {
  data: T[];
  pagination: PaginationInfo;
  meta: ResponseMeta;
}

export interface ActionResponse {
  success: boolean;
  message: string;
  data?: any;
  meta?: ResponseMeta;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextPage?: number;
  prevPage?: number;
}

export interface ResponseMeta {
  timestamp: string;
  requestId?: string;
  version?: string;
  resultCount?: number;
  queryTime?: string;
  [key: string]: any;
}
```

### Error Response Structure
```typescript
// src/shared/filters/http-exception.filter.ts
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
  meta: {
    timestamp: string;
    path: string;
    method: string;
    requestId?: string;
  };
}

export interface ValidationErrorResponse {
  error: {
    code: string;
    message: string;
    errors: ValidationError[];
  };
  meta: ResponseMeta;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
}
```

### Example Responses
```json
// Success - Single user
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "role": "admin",
    "status": "active",
    "createdAt": "2024-01-01T08:00:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  },
  "meta": {
    "timestamp": "2024-01-15T12:00:00Z",
    "requestId": "req-456-uuid",
    "version": "v1"
  }
}

// Success - User collection
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "role": "admin",
      "status": "active",
      "createdAt": "2024-01-01T08:00:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPreviousPage": false,
    "nextPage": 2,
    "prevPage": null
  },
  "meta": {
    "timestamp": "2024-01-15T12:00:00Z",
    "requestId": "req-456-uuid",
    "resultCount": 20,
    "queryTime": "45ms"
  }
}

// Success - Action response
{
  "success": true,
  "message": "User activated successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "active",
    "activatedAt": "2024-01-15T12:00:00Z"
  },
  "meta": {
    "timestamp": "2024-01-15T12:00:00Z",
    "requestId": "req-789-uuid"
  }
}

// Error - Validation failed
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "errors": [
      {
        "field": "name",
        "message": "Name must be at least 2 characters",
        "code": "MIN_LENGTH",
        "value": "J"
      },
      {
        "field": "email",
        "message": "Email must be a valid email address",
        "code": "INVALID_FORMAT",
        "value": "invalid-email"
      }
    ]
  },
  "meta": {
    "timestamp": "2024-01-15T12:00:00Z",
    "path": "/api/v1/users",
    "method": "POST",
    "requestId": "req-error-uuid"
  }
}

// Error - Rate limit exceeded
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests",
    "details": {
      "retryAfter": 60,
      "limit": 100,
      "window": "1m",
      "remaining": 0
    }
  },
  "meta": {
    "timestamp": "2024-01-15T12:00:00Z",
    "path": "/api/v1/users",
    "method": "GET"
  }
}
```

## Status Codes

### Success Codes
- `200 OK` - Successful GET, PUT, PATCH requests
- `201 Created` - Successful POST creating new resource
- `204 No Content` - Successful DELETE or action with no response body
- `206 Partial Content` - Partial data returned (rare)

### Client Error Codes
- `400 Bad Request` - Invalid request data or parameters
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Authenticated but not authorized for this resource
- `404 Not Found` - Resource doesn't exist
- `409 Conflict` - Conflict with current resource state (e.g., duplicate email)
- `422 Unprocessable Entity` - Validation failed
- `429 Too Many Requests` - Rate limit exceeded

### Server Error Codes
- `500 Internal Server Error` - General server error
- `502 Bad Gateway` - External service error
- `503 Service Unavailable` - Service temporarily down
- `504 Gateway Timeout` - External service timeout

## Authentication & Authorization

### JWT Guards Implementation
```typescript
// src/frameworks/auth/jwt-auth.guard.ts
import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
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

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('Invalid or expired token');
    }
    return user;
  }
}

// src/frameworks/auth/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '@/shared/decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
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
        `Insufficient permissions. Required roles: ${requiredRoles.join(', ')}`,
      );
    }
    
    return true;
  }
}
```

### Custom Decorators
```typescript
// src/shared/decorators/public.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

// src/shared/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

// src/shared/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    
    return data ? user?.[data] : user;
  },
);
```

### Usage in Controllers
```typescript
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  @Public() // This endpoint is public
  @Get('public-info')
  async getPublicInfo() {
    return { message: 'This is public information' };
  }

  @Roles('admin') // Only admins can access
  @Post()
  async createUser(@Body() dto: CreateUserDto) {
    // ...
  }

  @Roles('admin', 'moderator') // Admins or moderators can access
  @Get()
  async listUsers() {
    // ...
  }

  @Get('me') // Any authenticated user can access
  async getCurrentUser(@CurrentUser() user: any) {
    return user;
  }

  @Patch('me') // Access current user ID
  async updateCurrentUser(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateUserDto,
  ) {
    // ...
  }
}
```

## Rate Limiting

### Implementation with @nestjs/throttler
```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60, // Time window in seconds
      limit: 100, // Max requests per window
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

// Custom rate limiter for specific endpoints
// src/shared/decorators/throttle.decorator.ts
import { Throttle } from '@nestjs/throttler';

// Login endpoint - stricter limits
export const LoginThrottle = () => Throttle(5, 900); // 5 requests per 15 minutes

// Write operations - moderate limits
export const WriteThrottle = () => Throttle(20, 60); // 20 requests per minute

// Search operations
export const SearchThrottle = () => Throttle(50, 60); // 50 requests per minute

// Usage in controller
@Controller('auth')
export class AuthController {
  @Post('login')
  @LoginThrottle()
  async login(@Body() loginDto: LoginDto) {
    // ...
  }
}

@Controller('users')
export class UserController {
  @Post()
  @WriteThrottle()
  async createUser(@Body() createUserDto: CreateUserDto) {
    // ...
  }

  @Get()
  @SearchThrottle()
  async search(@Query() query: SearchQuery) {
    // ...
  }
}
```

## Global Exception Filter

```typescript
// src/shared/filters/http-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ThrottlerException } from '@nestjs/throttler';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: HttpStatus;
    let code: string;
    let message: string;
    let details: any;

    if (exception instanceof ThrottlerException) {
      status = HttpStatus.TOO_MANY_REQUESTS;
      code = 'RATE_LIMIT_EXCEEDED';
      message = 'Too many requests';
      details = {
        retryAfter: 60,
        limit: 100,
        window: '1m',
      };
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'object') {
        code = (exceptionResponse as any).error || 'HTTP_EXCEPTION';
        message = (exceptionResponse as any).message || exception.message;
        details = (exceptionResponse as any).details;
      } else {
        code = 'HTTP_EXCEPTION';
        message = exceptionResponse as string;
      }
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      code = 'INTERNAL_ERROR';
      message = 'Internal server error';

      // Log unexpected errors
      this.logger.error(
        `Unexpected error: ${exception}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    const errorResponse = {
      error: {
        code,
        message,
        ...(details && { details }),
      },
      meta: {
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
        requestId: request.headers['x-request-id'],
      },
    };

    response.status(status).json(errorResponse);
  }
}
```

## Global Validation Pipe

```typescript
// src/main.ts
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties exist
      transform: true, // Transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true, // Automatically convert types
      },
      exceptionFactory: (errors) => {
        // Custom error format
        const formattedErrors = errors.map((error) => ({
          field: error.property,
          message: Object.values(error.constraints || {}).join(', '),
          code: 'VALIDATION_ERROR',
        }));

        return new HttpException(
          {
            error: 'VALIDATION_ERROR',
            message: 'Validation failed',
            errors: formattedErrors,
          },
          HttpStatus.BAD_REQUEST,
        );
      },
    }),
  );

  await app.listen(3000);
}
bootstrap();
```

## Swagger/OpenAPI Documentation

### Setup
```typescript
// src/main.ts
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Argo Identity API')
    .setDescription('Identity and authentication API with Clean Architecture')
    .setVersion('1.0')
    .addTag('users', 'User management endpoints')
    .addTag('auth', 'Authentication endpoints')
    .addTag('roles', 'Role management endpoints')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  await app.listen(3000);
}
```

### Controller Documentation Example
```typescript
@ApiTags('users')
@Controller('users')
@ApiBearerAuth('JWT-auth')
export class UserController {
  @Post()
  @ApiOperation({
    summary: 'Create a new user',
    description: 'Creates a new user account with the provided details',
  })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    type: UserResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed',
    schema: {
      example: {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          errors: [
            {
              field: 'email',
              message: 'Email must be a valid email address',
              code: 'INVALID_FORMAT',
            },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - email already exists',
  })
  async createUser(@Body() createUserDto: CreateUserDto): Promise<UserResponse> {
    // ...
  }
}
```

## API Versioning

### URI Versioning (Recommended)
```typescript
// src/main.ts
import { VersioningType } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  await app.listen(3000);
}

// Controller with version
@Controller({
  path: 'users',
  version: '1',
})
export class UserControllerV1 {
  // /api/v1/users
}

@Controller({
  path: 'users',
  version: '2',
})
export class UserControllerV2 {
  // /api/v2/users
}
```

## Health Check Endpoint

```typescript
// src/adapters/controllers/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService, PrismaHealthIndicator } from '@nestjs/terminus';
import { Public } from '@/shared/decorators/public.decorator';
import { PrismaService } from '@/frameworks/database/prisma/prisma.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prismaHealth: PrismaHealthIndicator,
    private prisma: PrismaService,
  ) {}

  @Get()
  @Public()
  @HealthCheck()
  @ApiOperation({ summary: 'Health check endpoint' })
  check() {
    return this.health.check([
      () => this.prismaHealth.pingCheck('database', this.prisma),
    ]);
  }
}
```

**สำคัญ**: ปฏิบัติตามมาตรฐานเหล่านี้อย่างสม่ำเสมอในทุก API endpoint เพื่อให้มั่นใจว่า API มีความสอดคล้อง ปลอดภัย และใช้งานได้ง่ายสำหรับนักพัฒนา
