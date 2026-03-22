import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsUrl } from 'class-validator';

export class CreateUrlDto {
  @ApiProperty({ example: 'https://www.exemplo.com.br/uma-url-muito-longa' })
  @IsNotEmpty({ message: 'A URL original é obrigatória' })
  @IsUrl({}, { message: 'Informe uma URL válida' })
  originalUrl: string;
  @IsOptional()
  @IsNumber({}, { message: 'Status deve ser um número' })
  status?: number;
  @IsOptional()
  @IsNotEmpty({ message: 'A URL encurtada deve ser uma string' })
  shortCode: string;
}
