import { Body, Controller, Delete, Get, Param, Patch, Post, Request, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from 'src/common/auth/public.decorator';
import { JwtPayload } from 'src/common/interfaces/jwt.interface';
import { CreateUrlDto } from './dto/create-url.dto';
import { UpdateUrlDto } from './dto/update-url.dto';
import { UrlsService } from './urls.service';

type AuthRequest = Request & { user: JwtPayload };

@ApiTags('urls')
@ApiBearerAuth()
@Controller('urls')
export class UrlsController {
  constructor(private readonly urlsService: UrlsService) {}

  @ApiOperation({ summary: 'Criar nova URL' })
  @Post()
  create(@Request() req: AuthRequest, @Body() createUrlDto: CreateUrlDto) {
    return this.urlsService.create(createUrlDto, req.user.sub);
  }

  @ApiOperation({ summary: 'Listar todas as URLs do usuário' })
  @Get()
  findAll(@Request() req: AuthRequest) {
    return this.urlsService.findAll(req.user.sub);
  }

  @ApiOperation({ summary: 'Buscar URL por url, filtrado pelo usuário' })
  @Get(':public_id')
  findOne(@Param('public_id') public_id: string, @Request() req: AuthRequest) {
    return this.urlsService.findOne(public_id, req.user.sub);
  }

  @Public()
  @ApiOperation({ summary: 'Redirecionar para a URL original' })
  @Get('shortCode/:shortCode')
  async redirect(@Param('shortCode') shortCode: string, @Res() res) {
    const url = await this.urlsService.findByShortCode(shortCode);
    await this.urlsService.incrementClicks(url.id);
    return res.status(301).redirect(url.originalUrl);
  }

  @ApiOperation({ summary: 'Atualizar URL por url, filtrado pelo usuário' })
  @Patch(':public_id')
  update(@Param('public_id') public_id: string, @Request() req: AuthRequest, @Body() updateUrlDto: UpdateUrlDto) {
    return this.urlsService.update(public_id, updateUrlDto, req.user.sub);
  }

  @ApiOperation({ summary: 'Deletar URL por url, filtrado pelo usuário' })
  @Delete(':public_id')
  remove(@Param('public_id') public_id: string, @Request() req: AuthRequest) {
    return this.urlsService.softDelete(public_id, req.user.sub);
  }
}
