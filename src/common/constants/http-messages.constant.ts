export const HTTP_SUCCESS_MESSAGES: Record<number, string> = {
  200: 'Requisição realizada com sucesso',
  201: 'Recurso criado com sucesso',
  204: 'Recurso removido com sucesso',
};

export const HTTP_ERROR_MESSAGES: Record<number, string> = {
  400: 'Requisição inválida',
  401: 'Não autorizado',
  403: 'Acesso negado',
  404: 'Recurso não encontrado',
  409: 'Conflito de dados',
  422: 'Dados inválidos',
  500: 'Erro interno do servidor',
};
