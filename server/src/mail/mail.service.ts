import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly config: ConfigService) {
    const host = config.get<string>('SMTP_HOST');
    if (host) {
      this.transporter = nodemailer.createTransport({
        host,
        port: config.get<number>('SMTP_PORT') ?? 587,
        secure: config.get<string>('SMTP_SECURE') === 'true',
        auth: {
          user: config.get<string>('SMTP_USER'),
          pass: config.get<string>('SMTP_PASS'),
        },
      });
    } else {
      this.logger.warn('SMTP_HOST not configured — emails disabled');
    }
  }

  async sendNotification(to: string, title: string, message: string, link?: string): Promise<void> {
    if (!this.transporter) return;
    try {
      const appUrl = this.config.get<string>('APP_URL') ?? 'http://localhost:3000';
      const fullLink = link ? `${appUrl}${link}` : appUrl;

      await this.transporter.sendMail({
        from: this.config.get<string>('SMTP_FROM') ?? 'no-reply@testmanagement.com',
        to,
        subject: title,
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
            <h2 style="font-size:18px;color:#1f2937;margin-bottom:8px">${title}</h2>
            <p style="font-size:14px;color:#4b5563;line-height:1.6;margin-bottom:20px">${message}</p>
            ${link ? `<a href="${fullLink}" style="display:inline-block;padding:10px 20px;background:#4f46e5;color:white;border-radius:6px;text-decoration:none;font-size:14px">View Details</a>` : ''}
            <hr style="margin-top:32px;border:none;border-top:1px solid #e5e7eb"/>
            <p style="font-size:11px;color:#9ca3af;margin-top:12px">Quality Intelligence — Test Management</p>
          </div>
        `,
      });
    } catch (err) {
      this.logger.error('Failed to send email notification', err);
    }
  }
}
