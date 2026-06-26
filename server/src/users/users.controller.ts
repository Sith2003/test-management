import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { ListUsersQuery } from './dto/list-users.query';
import { UpdateUserAdminDto } from './dto/update-user-admin.dto';
import { CreateUserAdminDto } from './dto/create-user-admin.dto';
import { ResetUserPasswordDto } from './dto/reset-password-admin.dto';
import { CurrentUser, JwtPayload } from '../shared/decorators/current-user.decorator';
import { Roles } from '../shared/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Users')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller({ path: 'users', version: '1' })
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List all users (admin only)' })
  findAll(@Query() query: ListUsersQuery, @CurrentUser() user: JwtPayload) {
    return this.usersService.findAll(query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new user (admin only)' })
  create(@Body() dto: CreateUserAdminDto) {
    return this.usersService.createUser(dto);
  }

  @Patch(':userId/password')
  @ApiOperation({ summary: 'Reset a user password (admin only)' })
  @ApiParam({ name: 'userId' })
  resetPassword(
    @Param('userId') userId: string,
    @Body() dto: ResetUserPasswordDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.usersService.resetUserPassword(userId, dto, user);
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Get single user by ID (admin only)' })
  @ApiParam({ name: 'userId' })
  findOne(@Param('userId') userId: string, @CurrentUser() user: JwtPayload) {
    return this.usersService.findOne(userId);
  }

  @Patch(':userId')
  @ApiOperation({ summary: 'Update user role and/or isActive (admin only)' })
  @ApiParam({ name: 'userId' })
  update(
    @Param('userId') userId: string,
    @Body() dto: UpdateUserAdminDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.usersService.updateUser(userId, dto, user);
  }

  @Delete(':userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user (admin only)' })
  @ApiParam({ name: 'userId' })
  remove(@Param('userId') userId: string, @CurrentUser() user: JwtPayload): Promise<void> {
    return this.usersService.remove(userId, user);
  }
}
