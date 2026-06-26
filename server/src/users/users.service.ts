import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { ListUsersQuery } from './dto/list-users.query';
import { UpdateUserAdminDto } from './dto/update-user-admin.dto';
import { CreateUserAdminDto } from './dto/create-user-admin.dto';
import { ResetUserPasswordDto } from './dto/reset-password-admin.dto';
import { JwtPayload } from '../shared/decorators/current-user.decorator';
import { buildPaginationMeta, CollectionResponse } from '../shared/types/api-response.types';
import { UserRole } from '@prisma/client';
import { PAGINATION } from '../shared/constants/pagination.constants';

const USER_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListUsersQuery): Promise<CollectionResponse<unknown>> {
    const page = query.page ?? PAGINATION.DEFAULT_PAGE;
    const limit = query.limit ?? PAGINATION.DEFAULT_LIMIT;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (query.role) where['role'] = query.role;
    if (query.isActive !== undefined) where['isActive'] = query.isActive;
    if (query.search) {
      where['OR'] = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: USER_SELECT,
      }),
    ]);

    return {
      data: items,
      pagination: buildPaginationMeta({ page, limit, total }),
      meta: { timestamp: new Date().toISOString() },
    };
  }

  async findOne(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: USER_SELECT,
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateUser(targetUserId: string, dto: UpdateUserAdminDto, requestingUser: JwtPayload) {
    if (requestingUser.id === targetUserId) {
      throw new ForbiddenException('Cannot modify your own account via admin endpoint');
    }

    const target = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!target) throw new NotFoundException('User not found');

    // Check if demoting the last admin
    if (dto.role && dto.role !== UserRole.ADMIN && target.role === UserRole.ADMIN) {
      const adminCount = await this.prisma.user.count({ where: { role: UserRole.ADMIN } });
      if (adminCount <= 1) {
        throw new BadRequestException('Cannot demote the last admin user');
      }
    }

    // Check if deactivating the last admin
    if (dto.isActive === false && target.role === UserRole.ADMIN) {
      const activeAdminCount = await this.prisma.user.count({
        where: { role: UserRole.ADMIN, isActive: true },
      });
      if (activeAdminCount <= 1) {
        throw new BadRequestException('Cannot deactivate the last active admin user');
      }
    }

    return this.prisma.user.update({
      where: { id: targetUserId },
      data: dto,
      select: USER_SELECT,
    });
  }

  async createUser(dto: CreateUserAdminDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already in use');

    const hashed = await bcrypt.hash(dto.password, 10);
    return this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        password: hashed,
        role: dto.role ?? UserRole.QA,
      },
      select: USER_SELECT,
    });
  }

  async resetUserPassword(targetUserId: string, dto: ResetUserPasswordDto, requestingUser: JwtPayload) {
    if (requestingUser.id === targetUserId) {
      throw new ForbiddenException('Use /auth/change-password to change your own password');
    }
    const target = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!target) throw new NotFoundException('User not found');

    const hashed = await bcrypt.hash(dto.newPassword, 10);
    return this.prisma.user.update({
      where: { id: targetUserId },
      data: { password: hashed },
      select: USER_SELECT,
    });
  }

  async remove(targetUserId: string, requestingUser: JwtPayload): Promise<void> {
    if (requestingUser.id === targetUserId) {
      throw new ForbiddenException('Cannot delete your own account');
    }

    const target = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!target) throw new NotFoundException('User not found');

    if (target.role === UserRole.ADMIN) {
      const adminCount = await this.prisma.user.count({ where: { role: UserRole.ADMIN } });
      if (adminCount <= 1) {
        throw new BadRequestException('Cannot delete the last admin user');
      }
    }

    await this.prisma.user.delete({ where: { id: targetUserId } });
  }
}
