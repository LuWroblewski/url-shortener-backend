import {
  type CallHandler,
  type ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import { format } from 'date-fns';
import { type Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { resolveErrorMessage, resolveSuccessMessage } from '../helpers/http-message.helper';
import type { ApiResponse } from '../interfaces/response.interface';

type HttpExceptionResponse = { message?: unknown };
type PaginatedResult<T> = [T[], number];

function isPaginated<T>(data: unknown): data is PaginatedResult<T> {
  return Array.isArray(data) && data.length === 2 && Array.isArray(data[0]) && typeof data[1] === 'number';
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest<{ url: string; query: { limit?: string; page?: string } }>();
    const response = context.switchToHttp().getResponse<{ statusCode: number }>();

    return next.handle().pipe(
      map((data): ApiResponse<T> => {
        const base = {
          statusCode: response.statusCode,
          message: resolveSuccessMessage(response.statusCode),
          request_date: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
          path: request.url,
        };

        if (isPaginated<T>(data)) {
          const [items, total] = data;
          const limit = Number(request.query.limit) || 10;
          const page = Number(request.query.page) || 1;
          const totalPages = Math.ceil(total / limit);

          return { ...base, totalPages, page, limit, data: items as unknown as T };
        }

        return { ...base, data };
      }),
      catchError((err: unknown) => {
        console.error('Erro capturado pelo interceptor:', err);

        const status = err instanceof HttpException ? err.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
        const message = this.resolveMessage(err, status);

        if (status >= 500) {
          Sentry.captureException(err);
        }

        const errorResponse: ApiResponse<null> = {
          statusCode: status,
          message,
          request_date: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
          path: request.url,
          data: null,
        };

        return throwError(() => new HttpException({ ...errorResponse, message }, status));
      }),
    );
  }

  private resolveMessage(err: unknown, status: number): string {
    if (!(err instanceof HttpException)) {
      return err instanceof Error ? err.message : resolveErrorMessage(status);
    }

    const res = err.getResponse();

    if (typeof res === 'string') return res;

    if (typeof res === 'object' && res !== null) {
      const { message } = res as HttpExceptionResponse;

      if (Array.isArray(message)) return message.map(String).join(', ');
      if (typeof message === 'string') return message;
      if (message != null) return JSON.stringify(message);
    }

    return resolveErrorMessage(status);
  }
}
