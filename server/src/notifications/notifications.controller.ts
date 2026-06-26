import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  HttpCode,
  Res,
  Query,
  UnauthorizedException,
  Sse,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../shared/decorators/current-user.decorator';
import { JwtPayload } from '../shared/decorators/current-user.decorator';
import { Public } from '../shared/decorators/public.decorator';

interface JwtRawPayload {
  sub: string;
  email: string;
  name: string;
  role: string;
  iat?: number;
  exp?: number;
}

@Controller({ path: 'notifications', version: '1' })
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.notificationsService.findAll(user.id);
  }

  @Get('unread-count')
  async getUnreadCount(@CurrentUser() user: JwtPayload) {
    const count = await this.notificationsService.getUnreadCount(user.id);
    return { count };
  }

  /** SSE stream — uses ?token= query param because EventSource cannot set headers */
  @Public()
  @Sse('stream')
  stream(
    @Query('token') token: string,
    @Res() res: Response,
  ): Observable<MessageEvent> {
    let userId: string;
    try {
      const payload = this.jwtService.verify<JwtRawPayload>(token, {
        secret: this.config.get<string>('JWT_SECRET'),
      });
      userId = payload.sub;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }

    const subject = this.notificationsService.getOrCreateStream(userId);

    res.on('close', () => {
      this.notificationsService.removeStream(userId);
    });

    return subject.asObservable() as unknown as Observable<MessageEvent>;
  }

  @Patch('read-all')
  @HttpCode(204)
  async markAllAsRead(@CurrentUser() user: JwtPayload) {
    await this.notificationsService.markAllAsRead(user.id);
  }

  @Patch(':id/read')
  markAsRead(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.notificationsService.markAsRead(user.id, id);
  }

  @Delete(':id')
  @HttpCode(204)
  async deleteOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    await this.notificationsService.deleteOne(user.id, id);
  }
}
