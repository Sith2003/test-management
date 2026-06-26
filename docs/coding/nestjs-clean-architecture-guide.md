# Clean Architecture Implementation Guide

## 🎯 Overview

คู่มือนี้จะช่วยให้ทีมพัฒนาเข้าใจและนำ Clean Architecture มาใช้ในโปรเจ็กต์ API ด้วย NestJS และ TypeScript อย่างถูกต้องและมีประสิทธิภาพ

## 📋 Table of Contents

1. [Clean Architecture Principles](#clean-architecture-principles)
2. [Layer Responsibilities](#layer-responsibilities)  
3. [Dependency Rule](#dependency-rule)
4. [Implementation Guidelines](#implementation-guidelines)
5. [Code Examples](#code-examples)
6. [Testing Strategy](#testing-strategy)
7. [Common Mistakes](#common-mistakes)
8. [Best Practices](#best-practices)

## 🏗️ Clean Architecture Principles

### Core Concepts
- **Dependency Rule**: Dependencies ต้องชี้เข้าหาใน (inward) เสมอ
- **Independence**: Inner layers ไม่ขึ้นอยู่กับ outer layers
- **Testability**: แต่ละ layer สามารถ test ได้อิสระ
- **Framework Independence**: Business logic ไม่ขึ้นอยู่กับ frameworks

### The Four Layers
```
🟡 Entities (Layer 1)        - Enterprise Business Rules
🔵 Use Cases (Layer 2)       - Application Business Rules  
🟠 Interface Adapters (Layer 3) - Interface Adapters
🔴 Frameworks & Drivers (Layer 4) - Frameworks & Drivers
```

## 📚 Layer Responsibilities

### 🟡 Layer 1: Entities (Enterprise Business Rules)

**จุดประสงค์**: เก็บ business rules ที่สำคัญที่สุดและเป็น core ของระบบ

**ที่อยู่**: `src/entities/`

**ความรับผิดชอบ**:
- Core business entities และ value objects
- Business rules ที่เป็นสากลและไม่เปลี่ยนแปลงบ่อย
- Domain logic ที่ไม่ขึ้นอยู่กับ application specific requirements

**ไม่ควรมี**:
- Dependencies กับ layers อื่น
- Framework-specific code
- Database หรือ UI concerns

**ตัวอย่าง**:
```typescript
// src/entities/user.entity.ts
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

export enum UserRole {
  Admin = 'admin',
  User = 'user',
  Moderator = 'moderator',
}

export enum UserStatus {
  Active = 'active',
  Inactive = 'inactive',
  Suspended = 'suspended',
  Pending = 'pending',
}

// Value Objects
export class Email {
  private constructor(private readonly value: string) {}

  static create(email: string): Email {
    if (!this.isValid(email)) {
      throw new Error('Invalid email format');
    }
    return new Email(email.toLowerCase());
  }

  getValue(): string {
    return this.value;
  }

  private static isValid(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

// Entity with business logic
export class User {
  private constructor(
    private readonly id: string,
    private name: string,
    private readonly email: Email,
    private password: string,
    private role: UserRole,
    private status: UserStatus,
    private readonly createdAt: Date,
    private updatedAt: Date,
  ) {}

  // Factory method for creation (new users)
  static create(props: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
  }): User {
    // Business rule validations
    if (!props.name || props.name.length < 2) {
      throw new Error('Name must be at least 2 characters');
    }

    if (props.password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    const email = Email.create(props.email);

    return new User(
      uuidv4(),
      props.name,
      email,
      props.password,
      props.role,
      UserStatus.Pending,
      new Date(),
      new Date(),
    );
  }

  // Factory method for reconstruction (from database)
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
    const email = Email.create(props.email);

    return new User(
      props.id,
      props.name,
      email,
      props.password,
      props.role,
      props.status,
      props.createdAt,
      props.updatedAt,
    );
  }

  // Business methods
  async hashPassword(): Promise<void> {
    // Business rule: Password must be hashed before storage
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    this.updatedAt = new Date();
  }

  async verifyPassword(plainPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, this.password);
  }

  activate(): void {
    // Business rule: Can only activate pending or inactive users
    if (this.status === UserStatus.Suspended) {
      throw new Error('Cannot activate suspended user');
    }
    this.status = UserStatus.Active;
    this.updatedAt = new Date();
  }

  deactivate(): void {
    this.status = UserStatus.Inactive;
    this.updatedAt = new Date();
  }

  suspend(reason: string): void {
    // Business rule: Must provide reason for suspension
    if (!reason) {
      throw new Error('Suspension reason is required');
    }
    this.status = UserStatus.Suspended;
    this.updatedAt = new Date();
  }

  updateProfile(name: string): void {
    // Business rule validation
    if (!name || name.length < 2) {
      throw new Error('Name must be at least 2 characters');
    }
    this.name = name;
    this.updatedAt = new Date();
  }

  changeRole(newRole: UserRole): void {
    // Business rule: Log role changes for audit
    this.role = newRole;
    this.updatedAt = new Date();
  }

  // Getters (encapsulation)
  getId(): string {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getEmail(): string {
    return this.email.getValue();
  }

  getPassword(): string {
    return this.password;
  }

  getRole(): UserRole {
    return this.role;
  }

  getStatus(): UserStatus {
    return this.status;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  isActive(): boolean {
    return this.status === UserStatus.Active;
  }

  hasRole(role: UserRole): boolean {
    return this.role === role;
  }

  isAdmin(): boolean {
    return this.role === UserRole.Admin;
  }

  canPerformAction(action: string): boolean {
    // Business rule: Check permissions based on role
    if (this.role === UserRole.Admin) return true;
    // Add more business rules here
    return false;
  }
}
```

### Benefits of Entities Layer
- **Pure Business Logic**: ไม่มี dependencies กับ external systems
- **Rich Domain Model**: Entities มี behavior ไม่ใช่แค่ data containers
- **Type Safety**: ใช้ value objects และ TypeScript types
- **Business Rules Enforcement**: กฎทางธุรกิจถูก enforce ใน code
- **Testability**: ง่ายต่อการ test เพราะไม่มี external dependencies

## 🔵 Layer 2: Use Cases (Application Business Rules)

**จุดประสงค์**: เก็บ application-specific business rules และ orchestrate entities

**ที่อยู่**: `src/usecases/`

**ความรับผิดชอบ**:
- Application business rules
- Orchestrate entities เพื่อทำงานร่วมกัน
- Define interfaces สำหรับ external dependencies
- Input/Output independent

**ไม่ควรมี**:
- Framework-specific code
- Database implementation details
- HTTP/UI concerns

### Use Case Interfaces
```typescript
// src/usecases/interfaces/user-repository.interface.ts
import { User } from '@/entities/user.entity';

export interface UserRepository {
  create(user: User): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  update(id: string, user: User): Promise<User>;
  delete(id: string, deletedBy: string, reason?: string): Promise<void>;
  exists(email: string): Promise<boolean>;
  findMany(params: FindManyParams): Promise<User[]>;
  count(params: CountParams): Promise<number>;
}

export interface FindManyParams {
  skip?: number;
  take?: number;
  where?: any;
  orderBy?: any;
}

export interface CountParams {
  where?: any;
}
```

### Use Case Implementation
```typescript
// src/usecases/user/create-user.usecase.ts
import { Injectable, ConflictException } from '@nestjs/common';
import { User, UserRole } from '@/entities/user.entity';
import { UserRepository } from '@/usecases/interfaces/user-repository.interface';

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

@Injectable()
export class CreateUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
  ) {}

  async execute(input: CreateUserInput): Promise<User> {
    // 1. Check business rules (email uniqueness)
    const existingUser = await this.userRepository.findByEmail(input.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // 2. Create domain entity with business logic
    const user = User.create({
      name: input.name,
      email: input.email,
      password: input.password,
      role: input.role,
    });

    // 3. Apply business rules (hash password)
    await user.hashPassword();

    // 4. Persist via repository
    const savedUser = await this.userRepository.create(user);

    // 5. Return result
    return savedUser;
  }
}
```

### More Complex Use Case Example
```typescript
// src/usecases/user/update-user.usecase.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { User } from '@/entities/user.entity';
import { UserRepository } from '@/usecases/interfaces/user-repository.interface';

export interface UpdateUserInput {
  id: string;
  name?: string;
  currentUserId: string; // For authorization
}

@Injectable()
export class UpdateUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
  ) {}

  async execute(input: UpdateUserInput): Promise<User> {
    // 1. Retrieve existing user
    const user = await this.userRepository.findById(input.id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 2. Check authorization (business rule)
    const currentUser = await this.userRepository.findById(input.currentUserId);
    if (!currentUser) {
      throw new NotFoundException('Current user not found');
    }

    // Business rule: Users can only update their own profile unless they're admin
    if (input.id !== input.currentUserId && !currentUser.isAdmin()) {
      throw new ForbiddenException('Cannot update other users');
    }

    // 3. Update entity with business logic
    if (input.name) {
      user.updateProfile(input.name);
    }

    // 4. Persist changes
    const updatedUser = await this.userRepository.update(user.getId(), user);

    return updatedUser;
  }
}
```

### List Use Case with Pagination
```typescript
// src/usecases/user/list-users.usecase.ts
import { Injectable } from '@nestjs/common';
import { User } from '@/entities/user.entity';
import { UserRepository, FindManyParams } from '@/usecases/interfaces/user-repository.interface';

export interface ListUsersInput {
  page: number;
  limit: number;
  search?: string;
  role?: string;
}

export interface ListUsersOutput {
  users: User[];
  total: number;
  page: number;
  totalPages: number;
}

@Injectable()
export class ListUsersUseCase {
  constructor(
    private readonly userRepository: UserRepository,
  ) {}

  async execute(input: ListUsersInput): Promise<ListUsersOutput> {
    // 1. Validate input
    const page = Math.max(1, input.page);
    const limit = Math.min(100, Math.max(1, input.limit)); // Max 100 per page

    // 2. Build query parameters
    const params: FindManyParams = {
      skip: (page - 1) * limit,
      take: limit,
      where: this.buildWhereClause(input),
      orderBy: { createdAt: 'desc' },
    };

    // 3. Execute queries
    const [users, total] = await Promise.all([
      this.userRepository.findMany(params),
      this.userRepository.count({ where: params.where }),
    ]);

    // 4. Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);

    return {
      users,
      total,
      page,
      totalPages,
    };
  }

  private buildWhereClause(input: ListUsersInput): any {
    const where: any = {
      deletedAt: null, // Only active users
    };

    if (input.search) {
      where.OR = [
        { name: { contains: input.search, mode: 'insensitive' } },
        { email: { contains: input.search, mode: 'insensitive' } },
      ];
    }

    if (input.role) {
      where.role = input.role;
    }

    return where;
  }
}
```

### Benefits of Use Cases Layer
- **Application-specific Business Rules**: เก็บ logic ที่เฉพาะเจาะจงกับ application
- **Orchestration**: ประสานงานระหว่าง entities และ external interfaces
- **Input/Output Independence**: ไม่ขึ้นอยู่กับ format ของ input/output
- **Single Responsibility**: แต่ละ use case ทำหน้าที่เดียว
- **Easy Testing**: ใช้ mock interfaces ได้ง่าย

## 🟠 Layer 3: Interface Adapters

**จุดประสงค์**: แปลงข้อมูลระหว่าง use cases และ external world

**ที่อยู่**: `src/adapters/`

**ความรับผิดชอบ**:
- Controllers (input adapters)
- Repository implementations
- Convert data formats
- Handle framework-specific concerns

### Controllers (Input Adapters)
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
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateUserUseCase } from '@/usecases/user/create-user.usecase';
import { GetUserUseCase } from '@/usecases/user/get-user.usecase';
import { UpdateUserUseCase } from '@/usecases/user/update-user.usecase';
import { ListUsersUseCase } from '@/usecases/user/list-users.usecase';
import { DeleteUserUseCase } from '@/usecases/user/delete-user.usecase';
import { JwtAuthGuard } from '@/frameworks/auth/jwt-auth.guard';
import { CurrentUser } from '@/shared/decorators/current-user.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ListUsersQuery } from './dto/list-users.query';
import { UserResponse } from './dto/user-response.dto';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly getUserUseCase: GetUserUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly listUsersUseCase: ListUsersUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully', type: UserResponse })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async createUser(@Body() createUserDto: CreateUserDto): Promise<UserResponse> {
    const user = await this.createUserUseCase.execute({
      name: createUserDto.name,
      email: createUserDto.email,
      password: createUserDto.password,
      role: createUserDto.role,
    });

    return this.toResponse(user);
  }

  @Get()
  @ApiOperation({ summary: 'List users with pagination' })
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
      },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User found', type: UserResponse })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUser(@Param('id') id: string): Promise<UserResponse> {
    const user = await this.getUserUseCase.execute(id);
    return this.toResponse(user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user' })
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser('id') currentUserId: string,
  ): Promise<UserResponse> {
    const user = await this.updateUserUseCase.execute({
      id,
      name: updateUserDto.name,
      currentUserId,
    });

    return this.toResponse(user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user (soft delete)' })
  async deleteUser(
    @Param('id') id: string,
    @CurrentUser('id') currentUserId: string,
  ): Promise<void> {
    await this.deleteUserUseCase.execute({
      id,
      deletedBy: currentUserId,
      reason: 'Deleted by admin',
    });
  }

  // Helper method to convert entity to response DTO
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

### DTOs (Data Transfer Objects)
```typescript
// src/adapters/controllers/dto/create-user.dto.ts
import { IsString, IsEmail, IsNotEmpty, MinLength, MaxLength, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@/entities/user.entity';

export class CreateUserDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'StrongPass123!' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @ApiProperty({ enum: UserRole, example: UserRole.User })
  @IsEnum(UserRole)
  role: UserRole;
}

// src/adapters/controllers/dto/update-user.dto.ts
import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'John Doe Updated' })
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(100)
  name?: string;
}

// src/adapters/controllers/dto/list-users.query.ts
import { IsOptional, IsInt, Min, Max, IsString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@/entities/user.entity';

export class ListUsersQuery {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ enum: UserRole })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}

// src/adapters/controllers/dto/user-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { UserRole, UserStatus } from '@/entities/user.entity';

export class UserResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ enum: UserRole })
  role: UserRole;

  @ApiProperty({ enum: UserStatus })
  status: UserStatus;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
```

### Repository Implementation (Data Access Adapter)
```typescript
// src/adapters/repositories/prisma/user.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/frameworks/database/prisma/prisma.service';
import { User } from '@/entities/user.entity';
import { UserRepository, FindManyParams, CountParams } from '@/usecases/interfaces/user-repository.interface';

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: User): Promise<User> {
    const created = await this.prisma.user.create({
      data: {
        name: user.getName(),
        email: user.getEmail(),
        password: user.getPassword(),
        role: user.getRole(),
        status: user.getStatus(),
      },
    });

    return User.reconstruct({
      id: created.id,
      name: created.name,
      email: created.email,
      password: created.password,
      role: created.role as any,
      status: created.status as any,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    });
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user || user.deletedAt) {
      return null;
    }

    return User.reconstruct({
      id: user.id,
      name: user.name,
      email: user.email,
      password: user.password,
      role: user.role as any,
      status: user.status as any,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || user.deletedAt) {
      return null;
    }

    return User.reconstruct({
      id: user.id,
      name: user.name,
      email: user.email,
      password: user.password,
      role: user.role as any,
      status: user.status as any,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  }

  async update(id: string, user: User): Promise<User> {
    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        name: user.getName(),
        updatedAt: new Date(),
      },
    });

    return User.reconstruct({
      id: updated.id,
      name: updated.name,
      email: updated.email,
      password: updated.password,
      role: updated.role as any,
      status: updated.status as any,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    });
  }

  async delete(id: string, deletedBy: string, reason?: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy,
        deletedReason: reason,
      },
    });
  }

  async exists(email: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: {
        email: email.toLowerCase(),
        deletedAt: null,
      },
    });

    return count > 0;
  }

  async findMany(params: FindManyParams): Promise<User[]> {
    const users = await this.prisma.user.findMany({
      ...params,
      where: {
        ...params.where,
        deletedAt: null,
      },
    });

    return users.map((user) =>
      User.reconstruct({
        id: user.id,
        name: user.name,
        email: user.email,
        password: user.password,
        role: user.role as any,
        status: user.status as any,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }),
    );
  }

  async count(params: CountParams): Promise<number> {
    return this.prisma.user.count({
      where: {
        ...params.where,
        deletedAt: null,
      },
    });
  }
}
```

### Benefits of Interface Adapters Layer
- **Data Conversion**: แปลงข้อมูลระหว่าง use cases และ external systems
- **Protocol Independence**: ไม่ขึ้นอยู่กับ specific protocols (HTTP, gRPC, etc.)
- **Easy Testing**: Mock ได้ง่ายเพื่อทดสอบ use cases
- **Separation of Concerns**: แยกการจัดการ input/output จาก business logic

## 🔴 Layer 4: Frameworks & Drivers

**จุดประสงค์**: External tools, frameworks, databases

**ที่อยู่**: `src/frameworks/`

**ความรับผิดชอบ**:
- NestJS modules และ configuration
- Database drivers
- External APIs
- Configuration management

### Module Setup
```typescript
// src/adapters/controllers/user.module.ts
import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { CreateUserUseCase } from '@/usecases/user/create-user.usecase';
import { GetUserUseCase } from '@/usecases/user/get-user.usecase';
import { UpdateUserUseCase } from '@/usecases/user/update-user.usecase';
import { ListUsersUseCase } from '@/usecases/user/list-users.usecase';
import { DeleteUserUseCase } from '@/usecases/user/delete-user.usecase';
import { PrismaUserRepository } from '@/adapters/repositories/prisma/user.repository';
import { PrismaModule } from '@/frameworks/database/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [UserController],
  providers: [
    // Use cases
    CreateUserUseCase,
    GetUserUseCase,
    UpdateUserUseCase,
    ListUsersUseCase,
    DeleteUserUseCase,
    // Repository
    {
      provide: 'UserRepository', // Use string token for interface
      useClass: PrismaUserRepository,
    },
  ],
  exports: ['UserRepository'],
})
export class UserModule {}
```

### Prisma Service
```typescript
// src/frameworks/database/prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' 
        ? ['query', 'error', 'warn'] 
        : ['error'],
    });
  }

  async onModuleInit() {
    this.logger.log('Connecting to database...');
    await this.$connect();
    this.logger.log('Database connected successfully');
  }

  async onModuleDestroy() {
    this.logger.log('Disconnecting from database...');
    await this.$disconnect();
    this.logger.log('Database disconnected');
  }

  async enableShutdownHooks(app: any) {
    this.$on('beforeExit', async () => {
      await app.close();
    });
  }
}

// src/frameworks/database/prisma/prisma.module.ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

## ⚡ Dependency Rule

### กฎสำคัญ
```
Layer 4 → Layer 3 → Layer 2 → Layer 1
(Outer)                        (Inner)
```

- **Layer 1 (Entities)** ไม่รู้จักใครเลย
- **Layer 2 (Use Cases)** รู้จักแค่ Layer 1
- **Layer 3 (Adapters)** รู้จัก Layer 2 และ Layer 1
- **Layer 4 (Frameworks)** รู้จัก Layer 3, Layer 2, และ Layer 1

### การทำ Dependency Inversion

**❌ ผิด**: Use case ขึ้นอยู่กับ concrete implementation
```typescript
// src/usecases/user/create-user.usecase.ts
import { PrismaUserRepository } from '@/adapters/repositories/prisma/user.repository'; // ❌ ผิด!

@Injectable()
export class CreateUserUseCase {
  constructor(
    private readonly userRepository: PrismaUserRepository, // ❌ Concrete class
  ) {}
}
```

**✅ ถูก**: Use case ขึ้นอยู่กับ interface และใช้ dependency injection
```typescript
// src/usecases/user/create-user.usecase.ts
import { Inject, Injectable } from '@nestjs/common';
import { UserRepository } from '@/usecases/interfaces/user-repository.interface'; // ✅ Interface

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject('UserRepository') // ✅ Inject via token
    private readonly userRepository: UserRepository, // ✅ Interface
  ) {}
}
```

## 🧪 Testing Strategy

### 1. Testing Entities (Layer 1)
```typescript
// src/entities/user.entity.spec.ts
import { User, UserRole } from './user.entity';

describe('User Entity', () => {
  describe('create', () => {
    it('should create a user with valid data', () => {
      const user = User.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: UserRole.User,
      });

      expect(user).toBeDefined();
      expect(user.getName()).toBe('John Doe');
      expect(user.getEmail()).toBe('john@example.com');
      expect(user.getRole()).toBe(UserRole.User);
      expect(user.getStatus()).toBe('pending');
    });

    it('should throw error for invalid name', () => {
      expect(() => {
        User.create({
          name: 'J', // Too short
          email: 'john@example.com',
          password: 'password123',
          role: UserRole.User,
        });
      }).toThrow('Name must be at least 2 characters');
    });

    it('should throw error for invalid email', () => {
      expect(() => {
        User.create({
          name: 'John Doe',
          email: 'invalid-email',
          password: 'password123',
          role: UserRole.User,
        });
      }).toThrow('Invalid email format');
    });

    it('should throw error for short password', () => {
      expect(() => {
        User.create({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'short',
          role: UserRole.User,
        });
      }).toThrow('Password must be at least 8 characters');
    });
  });

  describe('business methods', () => {
    let user: User;

    beforeEach(() => {
      user = User.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: UserRole.User,
      });
    });

    it('should activate user', () => {
      user.activate();
      expect(user.isActive()).toBe(true);
    });

    it('should update profile', () => {
      user.updateProfile('Jane Doe');
      expect(user.getName()).toBe('Jane Doe');
    });

    it('should verify password', async () => {
      await user.hashPassword();
      const isValid = await user.verifyPassword('password123');
      expect(isValid).toBe(true);
    });
  });
});
```

### 2. Testing Use Cases (Layer 2)
```typescript
// src/usecases/user/create-user.usecase.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { CreateUserUseCase } from './create-user.usecase';
import { UserRepository } from '@/usecases/interfaces/user-repository.interface';
import { User, UserRole } from '@/entities/user.entity';

describe('CreateUserUseCase', () => {
  let useCase: CreateUserUseCase;
  let userRepository: jest.Mocked<UserRepository>;

  beforeEach(async () => {
    const mockUserRepository = {
      create: jest.fn(),
      findByEmail: jest.fn(),
      exists: jest.fn(),
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

  it('should create a user successfully', async () => {
    // Arrange
    const input = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      role: UserRole.User,
    };

    userRepository.findByEmail.mockResolvedValue(null);
    userRepository.create.mockImplementation((user) => Promise.resolve(user));

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(result).toBeDefined();
    expect(result.getName()).toBe('John Doe');
    expect(result.getEmail()).toBe('john@example.com');
    expect(userRepository.findByEmail).toHaveBeenCalledWith('john@example.com');
    expect(userRepository.create).toHaveBeenCalled();
  });

  it('should throw ConflictException when email already exists', async () => {
    // Arrange
    const input = {
      name: 'John Doe',
      email: 'existing@example.com',
      password: 'password123',
      role: UserRole.User,
    };

    const existingUser = User.create(input);
    userRepository.findByEmail.mockResolvedValue(existingUser);

    // Act & Assert
    await expect(useCase.execute(input)).rejects.toThrow(ConflictException);
    expect(userRepository.create).not.toHaveBeenCalled();
  });
});
```

### 3. Testing Controllers (Layer 3)
```typescript
// src/adapters/controllers/user.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { CreateUserUseCase } from '@/usecases/user/create-user.usecase';
import { User, UserRole } from '@/entities/user.entity';

describe('UserController', () => {
  let controller: UserController;
  let createUserUseCase: jest.Mocked<CreateUserUseCase>;

  beforeEach(async () => {
    const mockCreateUserUseCase = {
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: CreateUserUseCase,
          useValue: mockCreateUserUseCase,
        },
        // Add other use cases as needed
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    createUserUseCase = module.get(CreateUserUseCase);
  });

  describe('createUser', () => {
    it('should create a user and return response DTO', async () => {
      // Arrange
      const createUserDto = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: UserRole.User,
      };

      const mockUser = User.create(createUserDto);
      createUserUseCase.execute.mockResolvedValue(mockUser);

      // Act
      const result = await controller.createUser(createUserDto);

      // Assert
      expect(result).toEqual({
        id: mockUser.getId(),
        name: 'John Doe',
        email: 'john@example.com',
        role: UserRole.User,
        status: mockUser.getStatus(),
        createdAt: mockUser.getCreatedAt(),
        updatedAt: mockUser.getUpdatedAt(),
      });
      expect(createUserUseCase.execute).toHaveBeenCalledWith(createUserDto);
    });
  });
});
```

### 4. Integration Tests (E2E)
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

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  describe('/users (POST)', () => {
    it('should create a new user', () => {
      return request(app.getHttpServer())
        .post('/users')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
          role: 'user',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.name).toBe('John Doe');
          expect(res.body.email).toBe('john@example.com');
          expect(res.body).not.toHaveProperty('password');
        });
    });

    it('should return 400 for invalid input', () => {
      return request(app.getHttpServer())
        .post('/users')
        .send({
          name: 'J', // Too short
          email: 'invalid-email',
          password: 'short',
        })
        .expect(400);
    });

    it('should return 409 when email already exists', async () => {
      // Create first user
      await request(app.getHttpServer())
        .post('/users')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
          role: 'user',
        })
        .expect(201);

      // Try to create duplicate
      return request(app.getHttpServer())
        .post('/users')
        .send({
          name: 'Jane Doe',
          email: 'john@example.com', // Same email
          password: 'password123',
          role: 'user',
        })
        .expect(409);
    });
  });
});
```

## ❌ Common Mistakes

### 1. การละเมิด Dependency Rule

**❌ ผิด**: Entity ขึ้นอยู่กับ Use Case
```typescript
// src/entities/user.entity.ts
import { UserRepository } from '@/usecases/interfaces/user-repository.interface'; // ❌ ผิด!

export class User {
  constructor(private repo: UserRepository) {} // ❌ Entity ไม่ควรรู้จัก repository
}
```

**✅ ถูก**: Entity ไม่ขึ้นอยู่กับใครเลย
```typescript
// src/entities/user.entity.ts
export class User {
  // Pure business logic only
  // No dependencies on outer layers
}
```

### 2. การใส่ Framework Code ใน Inner Layers

**❌ ผิด**: Use Case ขึ้นอยู่กับ NestJS decorators
```typescript
// src/usecases/user/create-user.usecase.ts
import { Controller } from '@nestjs/common'; // ❌ ผิด!

@Controller() // ❌ ผิด! Use cases ไม่ควรมี framework decorators
export class CreateUserUseCase {}
```

**✅ ถูก**: Use Case เป็น plain TypeScript class
```typescript
// src/usecases/user/create-user.usecase.ts
import { Injectable } from '@nestjs/common'; // ✅ Injectable เป็น DI decorator ที่ยอมรับได้

@Injectable() // ✅ ถูก - ใช้เฉพาะ DI
export class CreateUserUseCase {
  // Plain business logic
}
```

### 3. การทำ Direct Database Calls ใน Use Cases

**❌ ผิด**: Use Case เรียก Prisma โดยตรง
```typescript
// src/usecases/user/create-user.usecase.ts
import { PrismaService } from '@/frameworks/database/prisma/prisma.service'; // ❌ ผิด!

@Injectable()
export class CreateUserUseCase {
  constructor(private prisma: PrismaService) {} // ❌ ผิด!

  async execute(input: any) {
    return this.prisma.user.create({ data: input }); // ❌ ผิด!
  }
}
```

**✅ ถูก**: Use Case ใช้ interface
```typescript
// src/usecases/user/create-user.usecase.ts
import { UserRepository } from '@/usecases/interfaces/user-repository.interface'; // ✅ ถูก!

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: UserRepository, // ✅ ถูก!
  ) {}

  async execute(input: any) {
    return this.userRepository.create(user); // ✅ ถูก!
  }
}
```

## ✅ Best Practices

### 1. การตั้งชื่อ

- **Entities**: ใช้ noun เช่น `User`, `Order`, `Product`
- **Use Cases**: ใช้ verb + noun + "UseCase" เช่น `CreateUserUseCase`, `GetUserProfileUseCase`
- **Interfaces**: ใช้ noun + suffix เช่น `UserRepository`, `EmailService`
- **Implementations**: ใช้ technology prefix เช่น `PrismaUserRepository`, `NestJSUserController`

### 2. การจัดการ Errors

```typescript
// Define domain errors in entities layer
// src/entities/errors/domain.errors.ts
export class DomainException extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ValidationException extends DomainException {}
export class NotFoundException extends DomainException {}
export class ConflictException extends DomainException {}
```

### 3. การใช้ Value Objects

```typescript
// src/entities/value-objects/email.vo.ts
export class Email {
  private constructor(private readonly value: string) {}

  static create(email: string): Email {
    if (!this.isValid(email)) {
      throw new Error('Invalid email format');
    }
    return new Email(email.toLowerCase());
  }

  getValue(): string {
    return this.value;
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }

  private static isValid(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
```

### 4. การใช้ NestJS Dependency Injection

```typescript
// src/adapters/controllers/user.module.ts
import { Module } from '@nestjs/common';
import { CreateUserUseCase } from '@/usecases/user/create-user.usecase';
import { PrismaUserRepository } from '@/adapters/repositories/prisma/user.repository';

@Module({
  providers: [
    CreateUserUseCase,
    {
      provide: 'UserRepository',
      useClass: PrismaUserRepository,
    },
  ],
})
export class UserModule {}
```

## 🚀 Quick Start Checklist

เมื่อเริ่มพัฒนา feature ใหม่ ให้ทำตามลำดับนี้:

### ✅ Step 1: Define Entity
- [ ] สร้าง entity ใน `src/entities/`
- [ ] เพิ่ม business logic และ validation rules
- [ ] เขียน unit tests สำหรับ entity

### ✅ Step 2: Define Use Case Interfaces
- [ ] สร้าง interfaces ใน `src/usecases/interfaces/`
- [ ] Define repository interfaces
- [ ] Define service interfaces (ถ้ามี)

### ✅ Step 3: Implement Use Cases
- [ ] สร้าง use cases ใน `src/usecases/[domain]/`
- [ ] Implement business logic
- [ ] เขียน unit tests พร้อม mocks

### ✅ Step 4: Implement Adapters
- [ ] สร้าง DTOs ใน `src/adapters/controllers/dto/`
- [ ] สร้าง controllers ใน `src/adapters/controllers/`
- [ ] สร้าง repository implementations ใน `src/adapters/repositories/`

### ✅ Step 5: Setup Frameworks
- [ ] สร้าง module ใน `src/adapters/controllers/`
- [ ] Setup dependency injection
- [ ] เขียน integration tests (e2e)

### ✅ Step 6: Wire Everything Together
- [ ] Register module ใน `app.module.ts`
- [ ] Test end-to-end functionality
- [ ] Update API documentation (Swagger)

## 📖 Additional Resources

- [Clean Architecture Book by Uncle Bob](https://www.amazon.com/Clean-Architecture-Craftsmans-Software-Structure/dp/0134494164)
- [NestJS Clean Architecture Example](https://github.com/pvarentsov/typescript-clean-architecture)
- [NestJS Documentation](https://docs.nestjs.com)
- [Domain-Driven Design with TypeScript](https://khalilstemmler.com/articles/domain-driven-design-intro/)

---

**หมายเหตุ**: คู่มือนี้เป็น living document ที่จะอัปเดตตามการเรียนรู้และประสบการณ์ของทีม อย่าลืมแชร์ feedback และข้อเสนอแนะเพื่อปรับปรุงคู่มือให้ดีขึ้น! 🚀
