import { Body, Controller, Get, Post, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from 'src/common/auth/public.decorator';
import type { JwtPayload } from 'src/common/interfaces/jwt.interface';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';

type AuthRequest = Request & { user: JwtPayload };

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @ApiOperation({ summary: 'Fazer login' })
  @Post()
  create(@Body() createAuthDto: CreateAuthDto) {
    return this.authService.signIn(createAuthDto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verificar se o token é válido' })
  @Get('verify')
  verify() {
    return { valid: true };
  }
}
