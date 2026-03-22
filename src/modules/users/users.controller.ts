import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaginationDto } from 'src/common/dto/pagination.dto';
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
  findAll(@Query() { limit = 10, page = 1 }: PaginationDto) {
    return this.usersService.findAll(limit, page);
  }

  @ApiOperation({ summary: 'Listar usuário por username' })
  @Get(':username')
  async findOneByUsername(@Param('username') username: string) {
    const { id, password, ...result } = await this.usersService.findOneUsername(username);
    return result;
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
