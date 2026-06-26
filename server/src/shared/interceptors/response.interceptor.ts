import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse, CollectionResponse } from '../types/api-response.types';

type ResponseData = Record<string, unknown> | unknown[] | null | undefined;

function isAlreadyWrapped(data: ResponseData): boolean {
  if (data === null || data === undefined) return false;
  if (typeof data !== 'object' || Array.isArray(data)) return false;
  const obj = data as Record<string, unknown>;
  return 'data' in obj && 'meta' in obj;
}

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T> | CollectionResponse<T>>
{
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T> | CollectionResponse<T>> {
    return next.handle().pipe(
      map((data: unknown) => {
        // If response is null or undefined, wrap it
        if (data === null || data === undefined) {
          return {
            data: null as unknown as T,
            meta: { timestamp: new Date().toISOString() },
          };
        }

        // Skip if already in the standard format
        if (isAlreadyWrapped(data as ResponseData)) {
          return data as ApiResponse<T> | CollectionResponse<T>;
        }

        const timestamp = new Date().toISOString();

        // Handle array responses (collections)
        if (Array.isArray(data)) {
          return {
            data: data as unknown as T[],
            meta: {
              timestamp,
              resultCount: data.length,
            },
          } as unknown as CollectionResponse<T>;
        }

        // Single object response
        return {
          data: data as T,
          meta: { timestamp },
        };
      }),
    );
  }
}
