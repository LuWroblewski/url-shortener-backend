import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty({ message: 'First name is required' })
  firstName: string;
  @IsNotEmpty({ message: 'Last name is required' })
  lastName: string;
  @IsNotEmpty({ message: 'User Name is required' })
  userName: string;
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail()
  email: string;
  @ApiPropertyOptional({ example: 1, description: 'Status do usuário (1 = ativo, 0 = inativo)' })
  @IsOptional()
  @IsNumber({}, { message: 'Status deve ser um número' })
  status?: number;
  @ApiProperty({ example: 'Test@1234' })
  @IsNotEmpty({ message: 'Password cannot be empty' })
  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(250, { message: 'Password cannot exceed 250 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[.@$!%*?&])[A-Za-z\d.@$!%*?&]{8,}$/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  password: string;
}
