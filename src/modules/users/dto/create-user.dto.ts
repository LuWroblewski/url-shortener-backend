import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty({ message: 'O primeiro nome é obrigatório' })
  firstName: string;

  @IsNotEmpty({ message: 'O sobrenome é obrigatório' })
  lastName: string;

  @IsNotEmpty({ message: 'O nome de usuário é obrigatório' })
  userName: string;

  @IsNotEmpty({ message: 'O e-mail é obrigatório' })
  @IsEmail({}, { message: 'Informe um e-mail válido' })
  email: string;

  @ApiPropertyOptional({ example: 1, description: 'Status do usuário (1 = ativo, 0 = inativo)' })
  @IsOptional()
  @IsNumber({}, { message: 'O status deve ser um número' })
  status?: number;

  @ApiProperty({ example: 'Test@1234' })
  @IsNotEmpty({ message: 'A senha não pode estar vazia' })
  @IsString({ message: 'A senha deve ser uma string' })
  @MinLength(8, { message: 'A senha deve ter no mínimo 8 caracteres' })
  @MaxLength(250, { message: 'A senha não pode ultrapassar 250 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[.@$!%*?&])[A-Za-z\d.@$!%*?&]{8,}$/, {
    message: 'A senha deve conter ao menos uma letra maiúscula, uma minúscula, um número e um caractere especial',
  })
  password: string;
}
