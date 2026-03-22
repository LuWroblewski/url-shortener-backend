import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { nanoid } from 'nanoid';
import { CacheService } from 'src/common/cache/cache.service';
import { Repository } from 'typeorm';
import { CreateUrlDto } from './dto/create-url.dto';
import { UpdateUrlDto } from './dto/update-url.dto';
import { Url } from './entities/url.entity';

const CACHE_TTL = 60 * 60; // 1 hora em segundos
const cacheKey = (shortCode: string) => `url:${shortCode}`;

@Injectable()
export class UrlsService {
  constructor(
    @InjectRepository(Url)
    private readonly urlsRepository: Repository<Url>,
    private readonly configService: ConfigService,
    private readonly cacheService: CacheService,
  ) {}

  async create(CreateUrlDto: CreateUrlDto, idUser: number) {
    const originalUrlExists = await this.urlsRepository.findOneBy({
      originalUrl: CreateUrlDto.originalUrl,
      createdBy: { id: idUser },
    });

    if (originalUrlExists)
      throw new ConflictException('URL original já está em uso por este usuário, não criada um novo registro');

    const appUrl = this.configService.get<string>('API_URL');
    let shortCode: string = '';
    let codeExists = true;

    while (codeExists) {
      shortCode = nanoid(6);
      codeExists = !!(await this.urlsRepository.findOneBy({ shortCode }));
    }

    const url = this.urlsRepository.create({
      ...CreateUrlDto,
      shortCode,
      createdBy: { id: idUser },
    });

    const savedUrl = await this.urlsRepository.save(url);
    const { id, createdBy, ...result } = savedUrl;

    return {
      ...result,
      shortUrl: `${appUrl}/urls/shortCode/${shortCode}`,
    };
  }

  async findByShortCode(shortCode: string) {
    const cached = await this.cacheService.get<Url>(cacheKey(shortCode));
    if (cached) return cached;

    const url = await this.urlsRepository.findOneBy({ shortCode });
    if (!url || url.status === 2) throw new NotFoundException('URL não encontrada');

    await this.cacheService.set(cacheKey(shortCode), url, CACHE_TTL);

    return url;
  }

  async incrementClicks(id: number) {
    await this.urlsRepository.increment({ id }, 'clicks', 1);
  }

  async findAll(idUser: number) {
    return this.urlsRepository.find({
      where: {
        createdBy: { id: idUser },
      },
    });
  }

  async findOne(public_id: string, idUser: number) {
    const url = await this.urlsRepository.findOneBy({
      public_id,
      createdBy: { id: idUser },
    });

    if (!url) throw new NotFoundException(`URL ${public_id} não encontrada`);

    return url;
  }

  async update(public_id: string, updateUrlDto: UpdateUrlDto, idUser: number) {
    const urlEntity = await this.findOne(public_id, idUser);

    if (updateUrlDto.originalUrl && updateUrlDto.originalUrl !== urlEntity.originalUrl) {
      const originalUrlExists = await this.urlsRepository.findOneBy({
        originalUrl: updateUrlDto.originalUrl,
        createdBy: { id: idUser },
      });

      if (originalUrlExists) throw new ConflictException('URL original já está em uso por este usuário');
    }

    await this.urlsRepository.save({
      ...urlEntity,
      ...updateUrlDto,
      updatedAt: new Date(),
    });

    await this.cacheService.del(cacheKey(urlEntity.shortCode));

    return this.findOne(public_id, idUser);
  }

  async softDelete(public_id: string, idUser: number) {
    const urlEntity = await this.urlsRepository.findOneBy({ public_id, createdBy: { id: idUser } });
    if (!urlEntity) throw new NotFoundException(`URL ${public_id} não encontrada`);
    if (urlEntity.status === 2) throw new NotFoundException(`URL ${public_id} já está deletada`);

    await this.urlsRepository.save({
      ...urlEntity,
      status: 2,
      disabledAt: new Date(),
      deletedBy: { id: idUser },
    });

    await this.cacheService.del(cacheKey(urlEntity.shortCode));
  }
}
