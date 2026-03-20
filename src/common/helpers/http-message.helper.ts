import { HTTP_ERROR_MESSAGES, HTTP_SUCCESS_MESSAGES } from '../constants/http-messages.constant';

export function resolveSuccessMessage(statusCode: number): string {
  return HTTP_SUCCESS_MESSAGES[statusCode] ?? 'Sucesso';
}

export function resolveErrorMessage(statusCode: number): string {
  return HTTP_ERROR_MESSAGES[statusCode] ?? 'Erro interno do servidor';
}
