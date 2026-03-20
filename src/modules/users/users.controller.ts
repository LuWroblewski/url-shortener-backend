import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { JwtPayload } from 'src/common/interfaces/jwt.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

type AuthRequest = Request & { user: JwtPayload };

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Criar novo usuário' })
  @Post()
  create(@Request() req: AuthRequest, @Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto, req.user.sub);
  }

  @ApiOperation({ summary: 'Listar todos os usuários' })
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @ApiOperation({ summary: 'Listar usuário por username' })
  @Get(':username')
  findOneByUsername(@Param('username') username: string) {
    return this.usersService.findOneUsername(username);
  }

  @ApiOperation({ summary: 'Atualizar usuário por username' })
  @Patch(':username')
  update(@Param('username') username: string, @Request() req: AuthRequest, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(username, updateUserDto, req.user.sub);
  }

  @ApiOperation({ summary: 'Deletar usuário por ID (soft delete)' })
  @Delete(':username')
  remove(@Param('username') username: string, @Request() req: AuthRequest) {
    return this.usersService.softDelete(username, req.user.sub);
  }
}
