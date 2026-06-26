# TypeScript & NestJS Coding Standards

## TypeScript Configuration

### TypeScript Version & Setup
```bash
# ใช้ Node.js 18+ และ TypeScript 5+
node --version  # ตรวจสอบเวอร์ชัน Node.js
npm --version   # ตรวจสอบเวอร์ชัน npm

# package.json setup
{
  "name": "abc-api",
  "version": "1.0.0",
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  },
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "@nestjs/config": "^3.0.0",
    "@nestjs/passport": "^10.0.0",
    "@nestjs/jwt": "^10.0.0",
    "@prisma/client": "^5.0.0",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.1",
    "passport-jwt": "^4.0.1",
    "bcrypt": "^5.1.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/jest": "^29.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "jest": "^29.0.0",
    "prisma": "^5.0.0",
    "typescript": "^5.0.0"
  }
}
```

### tsconfig.json
```json
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2021",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "strictBindCallApply": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "paths": {
      "@/*": ["src/*"],
      "@entities/*": ["src/entities/*"],
      "@usecases/*": ["src/usecases/*"],
      "@adapters/*": ["src/adapters/*"],
      "@frameworks/*": ["src/frameworks/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "test"]
}
```

## Naming Conventions

### File Names
```typescript
// ใช้ kebab-case สำหรับไฟล์
user.entity.ts              // ✅ Good - Entity file
create-user.usecase.ts      // ✅ Good - Use case file
user.controller.ts          // ✅ Good - Controller file
user-repository.interface.ts // ✅ Good - Interface file
jwt-auth.guard.ts           // ✅ Good - Guard file
create-user.dto.ts          // ✅ Good - DTO file

// ❌ Avoid
UserEntity.ts
createUserUseCase.ts
user_controller.ts
```

### Class Names
```typescript
// PascalCase สำหรับ classes, interfaces, types, enums
class User { }                    // ✅ Good - Entity
class CreateUserUseCase { }       // ✅ Good - Use case
class UserController { }          // ✅ Good - Controller
interface UserRepository { }      // ✅ Good - Interface
type UserRole = 'admin' | 'user'; // ✅ Good - Type alias
enum UserStatus { }               // ✅ Good - Enum

// ❌ Avoid
class user { }
class createUserUseCase { }
interface user_repository { }
```

### Variables & Functions
```typescript
// camelCase สำหรับ variables, functions, methods
const userService: UserService;
const databaseConnection: PrismaClient;
let isAuthenticated: boolean;

function createUser() { }
function validateEmail(email: string) { }
async function getUserById(id: string) { }

// Constants ใช้ UPPER_SNAKE_CASE
const MAX_LOGIN_ATTEMPTS = 5;
const JWT_EXPIRY_TIME = '24h';
const DEFAULT_PAGE_SIZE = 20;

// Private properties ขึ้นต้นด้วย underscore (optional)
private _internalState: string;
private readonly _config: Config;
```

### Interfaces & Types
```typescript
// Interface names ไม่ต้องขึ้นต้นด้วย "I" (NestJS convention)
interface UserRepository {
  findById(id: string): Promise<User | null>;
  create(user: User): Promise<User>;
}

// Type aliases สำหรับ union types หรือ complex types
type UserRole = 'admin' | 'user' | 'moderator';
type Nullable<T> = T | null;
type AsyncFunction<T> = (...args: any[]) => Promise<T>;

// DTOs (Data Transfer Objects)
class CreateUserDto {
  name: string;
  email: string;
  password: string;
}

// Response types
interface ApiResponse<T> {
  data: T;
  meta: ResponseMeta;
}
```

### Enums
```typescript
// PascalCase สำหรับ enum names และ values
enum UserRole {
  Admin = 'admin',
  User = 'user',
  Moderator = 'moderator',
}

enum UserStatus {
  Active = 'active',
  Inactive = 'inactive',
  Pending = 'pending',
  Suspended = 'suspended',
}

// การใช้งาน
const role: UserRole = UserRole.Admin;
if (user.status === UserStatus.Active) {
  // ...
}
```

## Project Structure (Clean Architecture)

```
src/
├── entities/                      # 🟡 Layer 1: Enterprise Business Rules
│   ├── user.entity.ts            # Core business entities
│   ├── role.entity.ts
│   └── errors/                   # Domain-specific errors
│       └── domain.errors.ts
│
├── usecases/                      # 🔵 Layer 2: Application Business Rules
│   ├── interfaces/               # Repository interfaces
│   │   ├── user-repository.interface.ts
│   │   └── auth-service.interface.ts
│   ├── user/                     # User-related use cases
│   │   ├── create-user.usecase.ts
│   │   ├── get-user.usecase.ts
│   │   └── update-user.usecase.ts
│   └── auth/                     # Authentication use cases
│       ├── login.usecase.ts
│       └── refresh-token.usecase.ts
│
├── adapters/                      # 🟠 Layer 3: Interface Adapters
│   ├── controllers/              # HTTP controllers
│   │   ├── user.controller.ts
│   │   ├── auth.controller.ts
│   │   └── dto/                  # Request/Response DTOs
│   │       ├── create-user.dto.ts
│   │       └── login.dto.ts
│   └── repositories/             # Repository implementations
│       └── prisma/
│           ├── user.repository.ts
│           └── prisma.service.ts
│
├── frameworks/                    # 🔴 Layer 4: Frameworks & Drivers
│   ├── database/                 # Database setup
│   │   └── prisma/
│   │       ├── prisma.module.ts
│   │       └── prisma.service.ts
│   ├── auth/                     # Authentication setup
│   │   ├── jwt.strategy.ts
│   │   ├── jwt-auth.guard.ts
│   │   └── auth.module.ts
│   ├── config/                   # Configuration
│   │   ├── configuration.ts
│   │   └── config.module.ts
│   └── logging/                  # Logging setup
│       ├── logger.service.ts
│       └── logger.module.ts
│
├── shared/                        # Shared utilities
│   ├── constants/
│   ├── decorators/
│   ├── filters/                  # Exception filters
│   ├── guards/                   # Guards
│   ├── interceptors/             # Interceptors
│   ├── pipes/                    # Validation pipes
│   └── types/
│
├── app.module.ts                  # Root module
└── main.ts                        # Application entry point
```

## Code Structure Standards

### Import Organization
```typescript
// src/adapters/controllers/user.controller.ts

// 1. Node.js built-in modules
import { readFileSync } from 'fs';
import { join } from 'path';

// 2. External packages (NestJS first, then others alphabetically)
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';

// 3. Internal imports with path aliases (by layer)
import { User } from '@/entities/user.entity';
import { CreateUserUseCase } from '@/usecases/user/create-user.usecase';
import { JwtAuthGuard } from '@/frameworks/auth/jwt-auth.guard';
import { CreateUserDto } from './dto/create-user.dto';

// 4. Types and interfaces
import type { ApiResponse } from '@/shared/types';
```

### Class Structure
```typescript
// การจัดระเบียบ class members
@Controller('users')
export class UserController {
  // 1. Properties (public first, then private)
  public readonly version = 'v1';
  private readonly logger: Logger;

  // 2. Constructor with dependency injection
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly getUserUseCase: GetUserUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
  ) {
    this.logger = new Logger(UserController.name);
  }

  // 3. Lifecycle hooks (if any)
  onModuleInit() {
    this.logger.log('UserController initialized');
  }

  // 4. Public methods (HTTP handlers)
  @Post()
  @UseGuards(JwtAuthGuard)
  async createUser(@Body() createUserDto: CreateUserDto) {
    return await this.createUserUseCase.execute(createUserDto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getUser(@Param('id') id: string) {
    return await this.getUserUseCase.execute(id);
  }

  // 5. Private helper methods
  private validateInput(input: unknown): boolean {
    // validation logic
    return true;
  }
}
```

### Entity Definition
```typescript
// src/entities/user.entity.ts
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

export enum UserRole {
  Admin = 'admin',
  User = 'user',
}

export enum UserStatus {
  Active = 'active',
  Inactive = 'inactive',
  Suspended = 'suspended',
}

export class User {
  // 1. Properties with types
  readonly id: string;
  name: string;
  email: string;
  private password: string;
  role: UserRole;
  status: UserStatus;
  readonly createdAt: Date;
  updatedAt: Date;

  // 2. Constructor (private for factory pattern)
  private constructor(props: {
    id?: string;
    name: string;
    email: string;
    password: string;
    role: UserRole;
    status?: UserStatus;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    this.id = props.id || uuidv4();
    this.name = props.name;
    this.email = props.email;
    this.password = props.password;
    this.role = props.role;
    this.status = props.status || UserStatus.Active;
    this.createdAt = props.createdAt || new Date();
    this.updatedAt = props.updatedAt || new Date();
  }

  // 3. Factory method for creation
  static create(props: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
  }): User {
    // Validation
    if (!props.name || props.name.length < 2) {
      throw new Error('Name must be at least 2 characters');
    }
    if (!this.isValidEmail(props.email)) {
      throw new Error('Invalid email format');
    }
    if (props.password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    return new User(props);
  }

  // 4. Factory method for reconstruction (from database)
  static reconstruct(props: {
    id: string;
    name: string;
    email: string;
    password: string;
    role: UserRole;
    status: UserStatus;
    createdAt: Date;
    updatedAt: Date;
  }): User {
    return new User(props);
  }

  // 5. Business methods
  async hashPassword(): Promise<void> {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }

  async verifyPassword(plainPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, this.password);
  }

  activate(): void {
    this.status = UserStatus.Active;
    this.updatedAt = new Date();
  }

  suspend(reason?: string): void {
    this.status = UserStatus.Suspended;
    this.updatedAt = new Date();
  }

  updateProfile(name: string): void {
    if (!name || name.length < 2) {
      throw new Error('Name must be at least 2 characters');
    }
    this.name = name;
    this.updatedAt = new Date();
  }

  // 6. Getters (for encapsulation)
  getId(): string {
    return this.id;
  }

  getEmail(): string {
    return this.email;
  }

  getRole(): UserRole {
    return this.role;
  }

  isActive(): boolean {
    return this.status === UserStatus.Active;
  }

  hasRole(role: UserRole): boolean {
    return this.role === role;
  }

  // 7. Static utility methods
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
```

## DTOs & Validation

### DTO Definition
```typescript
// src/adapters/controllers/dto/create-user.dto.ts
import {
  IsString,
  IsEmail,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsEnum,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@/entities/user.entity';

export class CreateUserDto {
  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(255)
  email: string;

  @ApiProperty({
    description: 'User password (min 8 characters, must contain uppercase, lowercase, number, and special character)',
    example: 'StrongPass123!',
    minLength: 8,
    maxLength: 128,
  })
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

  @ApiProperty({
    description: 'User role',
    enum: UserRole,
    example: UserRole.User,
  })
  @IsEnum(UserRole)
  @IsNotEmpty()
  role: UserRole;
}
```

### Custom Validators
```typescript
// src/shared/validators/is-strong-password.validator.ts
import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isStrongPassword',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') return false;

          // At least 8 characters
          if (value.length < 8) return false;

          // At least one lowercase
          if (!/[a-z]/.test(value)) return false;

          // At least one uppercase
          if (!/[A-Z]/.test(value)) return false;

          // At least one number
          if (!/\d/.test(value)) return false;

          // At least one special character
          if (!/[@$!%*?&]/.test(value)) return false;

          return true;
        },
        defaultMessage(args: ValidationArguments) {
          return 'Password must contain at least 8 characters, one uppercase, one lowercase, one number, and one special character';
        },
      },
    });
  };
}

// การใช้งาน
export class UpdatePasswordDto {
  @IsStrongPassword()
  newPassword: string;
}
```

## Error Handling

### Custom Exceptions
```typescript
// src/entities/errors/domain.errors.ts
export class DomainException extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationException extends DomainException {
  constructor(message: string, public readonly field?: string) {
    super(message);
  }
}

export class NotFoundException extends DomainException {
  constructor(resource: string, id: string) {
    super(`${resource} with id '${id}' not found`);
  }
}

export class ConflictException extends DomainException {
  constructor(message: string) {
    super(message);
  }
}

export class UnauthorizedException extends DomainException {
  constructor(message: string = 'Unauthorized') {
    super(message);
  }
}

export class ForbiddenException extends DomainException {
  constructor(message: string = 'Forbidden') {
    super(message);
  }
}
```

### Exception Filter
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
import {
  DomainException,
  ValidationException,
  NotFoundException,
  ConflictException,
} from '@/entities/errors/domain.errors';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: HttpStatus;
    let message: string;
    let code: string;
    let details: any;

    if (exception instanceof ValidationException) {
      status = HttpStatus.BAD_REQUEST;
      message = exception.message;
      code = 'VALIDATION_ERROR';
      details = exception.field ? { field: exception.field } : undefined;
    } else if (exception instanceof NotFoundException) {
      status = HttpStatus.NOT_FOUND;
      message = exception.message;
      code = 'NOT_FOUND';
    } else if (exception instanceof ConflictException) {
      status = HttpStatus.CONFLICT;
      message = exception.message;
      code = 'CONFLICT';
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as any).message || 'An error occurred';
      code = (exceptionResponse as any).error || 'HTTP_EXCEPTION';
      details = (exceptionResponse as any).details;
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
      code = 'INTERNAL_ERROR';

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
      },
    };

    response.status(status).json(errorResponse);
  }
}
```

## Testing Standards

### Testing Philosophy
```typescript
/**
 * Testing Standards for NestJS Applications
 *
 * 1. Test Pyramid:
 *    - Unit Tests (70%): Test individual functions, methods, entities
 *    - Integration Tests (20%): Test API endpoints, database interactions
 *    - E2E Tests (10%): Test complete user flows
 *
 * 2. Test Coverage Goals:
 *    - Minimum: 80% code coverage
 *    - Critical paths: 100% coverage (auth, payments, data integrity)
 *
 * 3. Test Organization:
 *    - Place unit tests next to source files: user.entity.spec.ts
 *    - Place integration tests in test/ folder: test/user.e2e-spec.ts
 */
```

### Unit Test Structure
```typescript
// src/usecases/user/create-user.usecase.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { CreateUserUseCase } from './create-user.usecase';
import { UserRepository } from '@/usecases/interfaces/user-repository.interface';
import { User, UserRole } from '@/entities/user.entity';
import { ConflictException } from '@/entities/errors/domain.errors';

describe('CreateUserUseCase', () => {
  let useCase: CreateUserUseCase;
  let userRepository: jest.Mocked<UserRepository>;

  beforeEach(async () => {
    // Create mock repository
    const mockUserRepository = {
      findByEmail: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateUserUseCase,
        {
          provide: 'UserRepository',
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    useCase = module.get<CreateUserUseCase>(CreateUserUseCase);
    userRepository = module.get('UserRepository');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const validInput = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'StrongPass123!',
      role: UserRole.User,
    };

    it('should create a user successfully', async () => {
      // Arrange
      userRepository.findByEmail.mockResolvedValue(null);
      const mockUser = User.create(validInput);
      userRepository.create.mockResolvedValue(mockUser);

      // Act
      const result = await useCase.execute(validInput);

      // Assert
      expect(result).toBeDefined();
      expect(result.getEmail()).toBe(validInput.email);
      expect(userRepository.findByEmail).toHaveBeenCalledWith(validInput.email);
      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: validInput.email,
        }),
      );
    });

    it('should throw ConflictException when email already exists', async () => {
      // Arrange
      const existingUser = User.create(validInput);
      userRepository.findByEmail.mockResolvedValue(existingUser);

      // Act & Assert
      await expect(useCase.execute(validInput)).rejects.toThrow(
        ConflictException,
      );
      await expect(useCase.execute(validInput)).rejects.toThrow(
        'Email already exists',
      );
      expect(userRepository.findByEmail).toHaveBeenCalledWith(validInput.email);
      expect(userRepository.create).not.toHaveBeenCalled();
    });

    it('should validate input before creating user', async () => {
      // Arrange
      const invalidInput = {
        name: 'J', // Too short
        email: 'invalid-email',
        password: 'weak',
        role: UserRole.User,
      };

      // Act & Assert
      await expect(useCase.execute(invalidInput as any)).rejects.toThrow();
    });
  });
});
```

### Entity Testing
```typescript
// src/entities/user.entity.spec.ts
describe('User Entity', () => {
  describe('create', () => {
    it('should create a valid user', () => {
      // Arrange
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'StrongPass123!',
        role: UserRole.User,
      };

      // Act
      const user = User.create(userData);

      // Assert
      expect(user).toBeInstanceOf(User);
      expect(user.name).toBe(userData.name);
      expect(user.email).toBe(userData.email);
      expect(user.role).toBe(userData.role);
      expect(user.id).toBeDefined();
      expect(user.createdAt).toBeInstanceOf(Date);
    });

    it('should throw error for invalid email', () => {
      // Arrange
      const userData = {
        name: 'John Doe',
        email: 'invalid-email',
        password: 'StrongPass123!',
        role: UserRole.User,
      };

      // Act & Assert
      expect(() => User.create(userData)).toThrow('Invalid email format');
    });

    it('should throw error for short password', () => {
      // Arrange
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'weak',
        role: UserRole.User,
      };

      // Act & Assert
      expect(() => User.create(userData)).toThrow(
        'Password must be at least 8 characters',
      );
    });
  });

  describe('business methods', () => {
    let user: User;

    beforeEach(() => {
      user = User.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'StrongPass123!',
        role: UserRole.User,
      });
    });

    it('should hash password', async () => {
      // Arrange
      const originalPassword = user['password'];

      // Act
      await user.hashPassword();

      // Assert
      expect(user['password']).not.toBe(originalPassword);
      expect(user['password']).toMatch(/^\$2[aby]\$/); // bcrypt hash pattern
    });

    it('should verify correct password', async () => {
      // Arrange
      const plainPassword = 'StrongPass123!';
      await user.hashPassword();

      // Act
      const isValid = await user.verifyPassword(plainPassword);

      // Assert
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      // Arrange
      await user.hashPassword();

      // Act
      const isValid = await user.verifyPassword('WrongPassword123!');

      // Assert
      expect(isValid).toBe(false);
    });

    it('should activate user', () => {
      // Arrange
      user.suspend();

      // Act
      user.activate();

      // Assert
      expect(user.status).toBe(UserStatus.Active);
      expect(user.isActive()).toBe(true);
    });

    it('should suspend user', () => {
      // Act
      user.suspend('Violation of terms');

      // Assert
      expect(user.status).toBe(UserStatus.Suspended);
      expect(user.isActive()).toBe(false);
    });
  });
});
```

### Integration Test
```typescript
// test/user.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/frameworks/database/prisma/prisma.service';

describe('UserController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Get auth token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'admin123',
      });
    authToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up database before each test
    await prisma.user.deleteMany();
  });

  describe('/users (POST)', () => {
    it('should create a new user', () => {
      return request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'StrongPass123!',
          role: 'user',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.email).toBe('john@example.com');
          expect(res.body).not.toHaveProperty('password');
        });
    });

    it('should return 400 for invalid input', () => {
      return request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'J', // Too short
          email: 'invalid-email',
          password: 'weak',
          role: 'user',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.error.code).toBe('VALIDATION_ERROR');
        });
    });

    it('should return 409 when email already exists', async () => {
      // Create first user
      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'StrongPass123!',
          role: 'user',
        })
        .expect(201);

      // Try to create duplicate
      return request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Jane Doe',
          email: 'john@example.com',
          password: 'StrongPass123!',
          role: 'user',
        })
        .expect(409)
        .expect((res) => {
          expect(res.body.error.code).toBe('CONFLICT');
        });
    });
  });

  describe('/users/:id (GET)', () => {
    it('should get user by id', async () => {
      // Arrange - Create a user first
      const createResponse = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'StrongPass123!',
          role: 'user',
        });

      const userId = createResponse.body.id;

      // Act & Assert
      return request(app.getHttpServer())
        .get(`/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(userId);
          expect(res.body.email).toBe('john@example.com');
        });
    });

    it('should return 404 for non-existent user', () => {
      return request(app.getHttpServer())
        .get('/users/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)
        .expect((res) => {
          expect(res.body.error.code).toBe('NOT_FOUND');
        });
    });

    it('should return 401 without auth token', () => {
      return request(app.getHttpServer())
        .get('/users/some-id')
        .expect(401);
    });
  });
});
```

### Test Utilities & Helpers
```typescript
// test/utils/test-helpers.ts
import { User, UserRole, UserStatus } from '@/entities/user.entity';

/**
 * Factory functions for creating test data
 */
export class TestDataFactory {
  /**
   * Create a mock user entity for testing
   */
  static createMockUser(overrides: Partial<User> = {}): User {
    const defaultUser = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'TestPass123!',
      role: UserRole.User,
    };

    return User.create({ ...defaultUser, ...overrides });
  }

  /**
   * Create multiple mock users
   */
  static createMockUsers(count: number): User[] {
    return Array.from({ length: count }, (_, i) =>
      this.createMockUser({
        name: `Test User ${i + 1}`,
        email: `test${i + 1}@example.com`,
      }),
    );
  }

  /**
   * Create a mock admin user
   */
  static createMockAdmin(overrides: Partial<User> = {}): User {
    return this.createMockUser({
      name: 'Admin User',
      email: 'admin@example.com',
      role: UserRole.Admin,
      ...overrides,
    });
  }
}

/**
 * Database cleanup utilities
 */
export class TestDatabaseHelper {
  /**
   * Clean all test data from database
   */
  static async cleanDatabase(prisma: any): Promise<void> {
    const tables = ['user', 'post', 'comment']; // Add your tables

    for (const table of tables) {
      await prisma[table].deleteMany({});
    }
  }

  /**
   * Seed database with test data
   */
  static async seedTestData(prisma: any): Promise<void> {
    // Create test users
    await prisma.user.createMany({
      data: [
        {
          name: 'Admin User',
          email: 'admin@example.com',
          password: 'hashed_password',
          role: 'admin',
        },
        {
          name: 'Test User',
          email: 'test@example.com',
          password: 'hashed_password',
          role: 'user',
        },
      ],
    });
  }
}

/**
 * Mock repository factory
 */
export class MockRepositoryFactory {
  /**
   * Create a mock user repository
   */
  static createUserRepository() {
    return {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
  }

  /**
   * Create a mock with default implementations
   */
  static createUserRepositoryWithDefaults(users: User[] = []) {
    return {
      findById: jest.fn((id: string) =>
        Promise.resolve(users.find((u) => u.id === id) || null),
      ),
      findByEmail: jest.fn((email: string) =>
        Promise.resolve(users.find((u) => u.email === email) || null),
      ),
      findMany: jest.fn(() => Promise.resolve(users)),
      create: jest.fn((user: User) => Promise.resolve(user)),
      update: jest.fn((id: string, data: Partial<User>) => {
        const user = users.find((u) => u.id === id);
        return Promise.resolve(user ? { ...user, ...data } : null);
      }),
      delete: jest.fn((id: string) => Promise.resolve(true)),
    };
  }
}

/**
 * Authentication helpers for E2E tests
 */
export class TestAuthHelper {
  /**
   * Get auth token for testing
   */
  static async getAuthToken(
    app: any,
    email: string = 'admin@example.com',
    password: string = 'admin123',
  ): Promise<string> {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password });

    return response.body.accessToken;
  }

  /**
   * Create request with auth header
   */
  static createAuthenticatedRequest(
    app: any,
    method: 'get' | 'post' | 'put' | 'patch' | 'delete',
    url: string,
    token: string,
  ) {
    return request(app.getHttpServer())
      [method](url)
      .set('Authorization', `Bearer ${token}`);
  }
}

// Usage in tests:
describe('UserService', () => {
  it('should create user', async () => {
    // Using factory
    const mockUser = TestDataFactory.createMockUser();
    const mockRepo = MockRepositoryFactory.createUserRepository();

    mockRepo.create.mockResolvedValue(mockUser);

    // Test logic...
  });
});
```

### Test Configuration
```typescript
// jest.config.js
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.interface.ts',
    '!src/**/*.module.ts',
    '!src/main.ts',
  ],
  coverageDirectory: './coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@entities/(.*)$': '<rootDir>/src/entities/$1',
    '^@usecases/(.*)$': '<rootDir>/src/usecases/$1',
    '^@adapters/(.*)$': '<rootDir>/src/adapters/$1',
    '^@frameworks/(.*)$': '<rootDir>/src/frameworks/$1',
  },
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};

// jest-e2e.config.js (for E2E tests)
module.exports = {
  ...require('./jest.config'),
  testRegex: '.*\\.e2e-spec\\.ts$',
  collectCoverage: false,
};
```

### Testing Best Practices
```typescript
/**
 * 1. AAA Pattern (Arrange-Act-Assert)
 */
it('should create user', async () => {
  // Arrange - Set up test data and mocks
  const userData = { name: 'John', email: 'john@example.com' };
  mockRepo.findByEmail.mockResolvedValue(null);

  // Act - Execute the function being tested
  const result = await userService.createUser(userData);

  // Assert - Verify the results
  expect(result).toBeDefined();
  expect(mockRepo.create).toHaveBeenCalled();
});

/**
 * 2. One Assertion Per Test (when possible)
 */
// ❌ Bad - Multiple unrelated assertions
it('should handle user operations', async () => {
  const user = await createUser();
  expect(user.id).toBeDefined();

  const updated = await updateUser(user.id);
  expect(updated.name).toBe('New Name');

  await deleteUser(user.id);
  expect(await findUser(user.id)).toBeNull();
});

// ✅ Good - Separate tests for each operation
it('should create user with generated id', async () => {
  const user = await createUser();
  expect(user.id).toBeDefined();
});

it('should update user name', async () => {
  const user = await createUser();
  const updated = await updateUser(user.id, { name: 'New Name' });
  expect(updated.name).toBe('New Name');
});

it('should delete user', async () => {
  const user = await createUser();
  await deleteUser(user.id);
  expect(await findUser(user.id)).toBeNull();
});

/**
 * 3. Test Naming Convention
 * Pattern: should [expected behavior] when [condition]
 */
describe('UserService', () => {
  describe('createUser', () => {
    it('should create user when valid data provided', () => {});
    it('should throw ValidationException when email is invalid', () => {});
    it('should throw ConflictException when email already exists', () => {});
  });
});

/**
 * 4. Avoid Test Interdependence
 */
// ❌ Bad - Tests depend on each other
describe('User CRUD', () => {
  let userId: string;

  it('should create user', async () => {
    const user = await createUser();
    userId = user.id; // Next test depends on this
  });

  it('should update user', async () => {
    await updateUser(userId, { name: 'New Name' }); // Depends on previous test
  });
});

// ✅ Good - Independent tests
describe('User CRUD', () => {
  beforeEach(async () => {
    // Set up fresh state for each test
    await cleanDatabase();
  });

  it('should create user', async () => {
    const user = await createUser();
    expect(user.id).toBeDefined();
  });

  it('should update user', async () => {
    const user = await createUser(); // Independent setup
    const updated = await updateUser(user.id, { name: 'New Name' });
    expect(updated.name).toBe('New Name');
  });
});

/**
 * 5. Mock External Dependencies
 */
// ✅ Good - Mock external services
describe('UserNotificationService', () => {
  let emailService: jest.Mocked<EmailService>;

  beforeEach(() => {
    emailService = {
      sendEmail: jest.fn().mockResolvedValue(true),
    } as any;
  });

  it('should send welcome email after user creation', async () => {
    await userNotificationService.notifyUserCreated(user);

    expect(emailService.sendEmail).toHaveBeenCalledWith({
      to: user.email,
      template: 'welcome',
    });
  });
});

/**
 * 6. Test Error Cases
 */
describe('error handling', () => {
  it('should handle database connection errors', async () => {
    // Arrange
    mockRepo.create.mockRejectedValue(new Error('Connection failed'));

    // Act & Assert
    await expect(userService.createUser(userData))
      .rejects
      .toThrow('Connection failed');
  });

  it('should handle validation errors', async () => {
    const invalidData = { email: 'invalid' };

    await expect(userService.createUser(invalidData))
      .rejects
      .toThrow(ValidationException);
  });
});

/**
 * 7. Use Snapshots for Complex Objects (carefully)
 */
describe('API responses', () => {
  it('should match expected response structure', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/users/123')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    // ✅ Good - Snapshot with dynamic data masked
    expect(response.body).toMatchSnapshot({
      id: expect.any(String),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
  });
});
```

## Performance & Best Practices

### Async/Await Patterns
```typescript
// ✅ Good - Use async/await properly
async function getUser(id: string): Promise<User | null> {
  try {
    const user = await this.userRepository.findById(id);
    return user;
  } catch (error) {
    this.logger.error(`Failed to get user: ${error.message}`);
    throw error;
  }
}

// ✅ Good - Parallel execution when possible
async function getUsersWithStats(userIds: string[]): Promise<UserWithStats[]> {
  const [users, stats] = await Promise.all([
    this.userRepository.findByIds(userIds),
    this.statsRepository.getStatsByUserIds(userIds),
  ]);

  return users.map((user) => ({
    user,
    stats: stats.find((s) => s.userId === user.id),
  }));
}

// ❌ Bad - Sequential execution when not needed
async function getUsersWithStatsBad(userIds: string[]): Promise<UserWithStats[]> {
  const users = await this.userRepository.findByIds(userIds);
  const stats = await this.statsRepository.getStatsByUserIds(userIds); // Waits unnecessarily
  // ...
}
```

### Type Safety
```typescript
// ✅ Good - Use strict types
interface UserFilter {
  role?: UserRole;
  status?: UserStatus;
  search?: string;
}

function filterUsers(filters: UserFilter): Promise<User[]> {
  return this.userRepository.findMany(filters);
}

// ✅ Good - Use type guards
function isUser(obj: any): obj is User {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.email === 'string' &&
    typeof obj.name === 'string'
  );
}

// ✅ Good - Use generics
class Repository<T> {
  constructor(private readonly model: any) {}

  async findById(id: string): Promise<T | null> {
    return this.model.findUnique({ where: { id } });
  }

  async create(data: Partial<T>): Promise<T> {
    return this.model.create({ data });
  }
}
```

### Memory Management
```typescript
// ✅ Good - Stream large datasets
async function* streamUsers(): AsyncGenerator<User> {
  let cursor: string | undefined;
  const batchSize = 100;

  do {
    const users = await this.userRepository.findMany({
      take: batchSize,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    });

    for (const user of users) {
      yield user;
    }

    cursor = users.length === batchSize ? users[users.length - 1].id : undefined;
  } while (cursor);
}

// การใช้งาน
for await (const user of streamUsers()) {
  await processUser(user);
}
```

## Code Documentation

### JSDoc Comments
```typescript
/**
 * Creates a new user in the system
 * 
 * This method validates the input, checks for duplicate emails,
 * creates the user entity, hashes the password, and persists to database.
 * 
 * @param input - User creation data
 * @param input.name - User's full name (2-100 characters)
 * @param input.email - User's email address (must be unique)
 * @param input.password - User's password (min 8 characters with complexity requirements)
 * @param input.role - User's role (admin or user)
 * 
 * @returns Promise resolving to the created User entity
 * 
 * @throws {ConflictException} When email already exists in the system
 * @throws {ValidationException} When input validation fails
 * 
 * @example
 * ```typescript
 * const user = await createUserUseCase.execute({
 *   name: 'John Doe',
 *   email: 'john@example.com',
 *   password: 'StrongPass123!',
 *   role: UserRole.User,
 * });
 * ```
 */
async execute(input: CreateUserDto): Promise<User> {
  // Implementation
}
```

Remember: TypeScript + NestJS มีหลักการ "Explicit is better than implicit" - เขียนโค้ดให้ชัดเจน มี type safety และใช้ NestJS dependency injection อย่างเต็มที่

