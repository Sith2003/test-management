import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { NotificationType } from '@prisma/client';

export interface CreateNotificationInput {
  userId: string;
  userEmail: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

@Injectable()
export class NotificationsService {
  private readonly streams = new Map<string, Subject<MessageEvent>>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  getOrCreateStream(userId: string): Subject<MessageEvent> {
    if (!this.streams.has(userId)) {
      this.streams.set(userId, new Subject<MessageEvent>());
    }
    return this.streams.get(userId)!;
  }

  removeStream(userId: string): void {
    const subject = this.streams.get(userId);
    if (subject) {
      subject.complete();
      this.streams.delete(userId);
    }
  }

  async create(input: CreateNotificationInput) {
    const notification = await this.prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        link: input.link,
      },
    });

    // Push SSE to the recipient if they have an active stream
    const stream = this.streams.get(input.userId);
    if (stream && !stream.closed) {
      stream.next({ data: JSON.stringify(notification) } as unknown as MessageEvent);
    }

    // Send email async (fire-and-forget)
    void this.mail.sendNotification(input.userEmail, input.title, input.message, input.link);

    return notification;
  }

  async findAll(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({ where: { userId, isRead: false } });
  }

  async markAsRead(userId: string, id: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async deleteOne(userId: string, id: string): Promise<void> {
    await this.prisma.notification.deleteMany({ where: { id, userId } });
  }
}
