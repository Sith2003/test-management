import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export interface JwtPayload {
  id: string;
  email: string;
  name: string;
  role: string;
}

export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext): JwtPayload | JwtPayload[keyof JwtPayload] => {
    const request = ctx.switchToHttp().getRequest<Request & { user: JwtPayload }>();
    const user = request.user;
    if (data) {
      return user[data];
    }
    return user;
  },
);
