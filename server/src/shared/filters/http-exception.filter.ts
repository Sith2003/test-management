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
import { Prisma } from '@prisma/client';
import { ErrorResponse } from '../types/api-response.types';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_SERVER_ERROR';
    let message = 'An unexpected error occurred';
    let details: string | Array<{ field?: string; message: string; value?: unknown }> | undefined;

    if (exception instanceof ThrottlerException) {
      status = HttpStatus.TOO_MANY_REQUESTS;
      code = 'RATE_LIMIT_EXCEEDED';
      message = 'Too many requests. Please try again later.';
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        code = this.statusToCode(status);
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as Record<string, unknown>;

        if (responseObj['error'] && typeof responseObj['error'] === 'object') {
          // Already formatted error
          response.status(status).json(exceptionResponse);
          return;
        }

        message = (responseObj['message'] as string) || message;
        code = (responseObj['code'] as string) || this.statusToCode(status);

        // Handle class-validator errors (array of messages)
        if (Array.isArray(responseObj['message'])) {
          details = (responseObj['message'] as string[]).map((msg) => ({ message: msg }));
          message = 'Validation failed';
          code = 'VALIDATION_ERROR';
        }
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const prismaError = exception as Prisma.PrismaClientKnownRequestError;
      switch (prismaError.code) {
        case 'P2002': {
          status = HttpStatus.CONFLICT;
          code = 'DUPLICATE_ENTRY';
          const target = (prismaError.meta?.['target'] as string[]) ?? [];
          message = `A record with this ${target.join(', ')} already exists`;
          break;
        }
        case 'P2025':
          status = HttpStatus.NOT_FOUND;
          code = 'RECORD_NOT_FOUND';
          message = 'The requested record was not found';
          break;
        case 'P2003':
          status = HttpStatus.BAD_REQUEST;
          code = 'FOREIGN_KEY_CONSTRAINT';
          message = 'Referenced record does not exist';
          break;
        case 'P2014':
          status = HttpStatus.BAD_REQUEST;
          code = 'RELATION_VIOLATION';
          message = 'The change you are trying to make would violate a required relation';
          break;
        default:
          status = HttpStatus.INTERNAL_SERVER_ERROR;
          code = 'DATABASE_ERROR';
          message = 'A database error occurred';
          this.logger.error(`Unhandled Prisma error: ${prismaError.code}`, prismaError.message);
      }
    } else if (exception instanceof Prisma.PrismaClientValidationError) {
      status = HttpStatus.BAD_REQUEST;
      code = 'DATABASE_VALIDATION_ERROR';
      message = 'Invalid data provided to the database';
    } else if (exception instanceof Error) {
      this.logger.error(`Unhandled error: ${exception.message}`, exception.stack);
      message = exception.message || 'An unexpected error occurred';
    }

    const errorResponse: ErrorResponse = {
      error: {
        code,
        message,
        ...(details !== undefined && { details }),
      },
      meta: {
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
      },
    };

    response.status(status).json(errorResponse);
  }

  private statusToCode(status: number): string {
    const statusMap: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      405: 'METHOD_NOT_ALLOWED',
      409: 'CONFLICT',
      410: 'GONE',
      422: 'UNPROCESSABLE_ENTITY',
      429: 'RATE_LIMIT_EXCEEDED',
      500: 'INTERNAL_SERVER_ERROR',
      501: 'NOT_IMPLEMENTED',
      502: 'BAD_GATEWAY',
      503: 'SERVICE_UNAVAILABLE',
    };
    return statusMap[status] ?? 'HTTP_ERROR';
  }
}
