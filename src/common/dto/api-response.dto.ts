import { ApiProperty } from '@nestjs/swagger';

export class ApiResponseDto<T> {
  @ApiProperty({ example: 201 })
  statusCode: number;

  @ApiProperty({ example: 'Recurso criado com sucesso' })
  message: string;

  @ApiProperty({ example: '2026-03-20 14:07:19' })
  request_date: string;

  @ApiProperty({ example: '/users' })
  path: string;

  @ApiProperty()
  data: T;
}
