jest.mock('nanoid', () => ({ nanoid: () => 'abc123' }));

import { ConflictException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CacheService } from 'src/common/cache/cache.service';
import { Url } from './entities/url.entity';
import { UrlsService } from './urls.service';

const mockUrl = {
  id: 1,
  public_id: 'uuid-url-1',
  originalUrl: 'https://google.com',
  shortCode: 'abc123',
  clicks: 0,
  status: 1,
  createdAt: new Date('2026-01-01'),
  updatedAt: null,
  disabledAt: null,
  createdBy: { id: 1 },
  updatedBy: null,
  deletedBy: null,
};

const mockRepository = {
  findOneBy: jest.fn(),
  findAndCount: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  increment: jest.fn(),
};

const mockConfigService = {
  get: jest.fn().mockReturnValue('http://localhost:3000'),
};

const mockCacheService = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
};

describe('UrlsService', () => {
  let service: UrlsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UrlsService,
        { provide: getRepositoryToken(Url), useValue: mockRepository },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: CacheService, useValue: mockCacheService },
      ],
    }).compile();

    service = module.get<UrlsService>(UrlsService);
    jest.clearAllMocks();
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const dto = { originalUrl: 'https://google.com', shortCode: 'abc123' };

    it('deve criar e retornar URL com shortUrl', async () => {
      mockRepository.findOneBy.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
      mockRepository.create.mockReturnValue(mockUrl);
      mockRepository.save.mockResolvedValue(mockUrl);

      const result = await service.create(dto, 1);

      expect(result).toHaveProperty('shortUrl');
      expect(result.shortUrl).toContain('abc123');
    });

    it('deve lançar ConflictException se URL já foi cadastrada pelo usuário', async () => {
      mockRepository.findOneBy.mockResolvedValueOnce(mockUrl);

      await expect(service.create(dto, 1)).rejects.toThrow(ConflictException);
    });
  });

  describe('findByShortCode', () => {
    it('deve retornar URL do cache se disponível', async () => {
      mockCacheService.get.mockResolvedValue(mockUrl);

      const result = await service.findByShortCode('abc123');

      expect(result).toEqual(mockUrl);
      expect(mockRepository.findOneBy).not.toHaveBeenCalled();
    });

    it('deve buscar no banco e cachear se não estiver no cache', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockRepository.findOneBy.mockResolvedValue(mockUrl);

      const result = await service.findByShortCode('abc123');

      expect(result).toEqual(mockUrl);
      expect(mockCacheService.set).toHaveBeenCalledWith('url:abc123', mockUrl, 3600);
    });

    it('deve lançar NotFoundException se shortCode não existir', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockRepository.findOneBy.mockResolvedValue(null);

      await expect(service.findByShortCode('invalido')).rejects.toThrow(NotFoundException);
    });

    it('deve lançar NotFoundException se URL estiver inativa (status 2)', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockRepository.findOneBy.mockResolvedValue({ ...mockUrl, status: 2 });

      await expect(service.findByShortCode('abc123')).rejects.toThrow(NotFoundException);
    });
  });

  describe('incrementClicks', () => {
    it('deve incrementar o contador de cliques', async () => {
      mockRepository.increment.mockResolvedValue(undefined);

      await service.incrementClicks(1);

      expect(mockRepository.increment).toHaveBeenCalledWith({ id: 1 }, 'clicks', 1);
    });
  });

  describe('findAll', () => {
    it('deve retornar [items, total] do usuário', async () => {
      mockRepository.findAndCount.mockResolvedValue([[mockUrl], 1]);

      const result = await service.findAll(1, 10, 1);

      expect(result).toEqual([[mockUrl], 1]);
    });

    it('deve repassar take e skip corretos ao repositório', async () => {
      mockRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll(1, 5, 3);

      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        where: { createdBy: { id: 1 } },
        take: 5,
        skip: 10,
      });
    });
  });

  describe('findOne', () => {
    it('deve retornar a URL pelo public_id', async () => {
      mockRepository.findOneBy.mockResolvedValue(mockUrl);

      const result = await service.findOne('uuid-url-1', 1);

      expect(result).toEqual(mockUrl);
    });

    it('deve lançar NotFoundException se URL não existir', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      await expect(service.findOne('uuid-inexistente', 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('deve atualizar e retornar a URL', async () => {
      const updated = { ...mockUrl, originalUrl: 'https://bing.com' };
      mockRepository.findOneBy.mockResolvedValueOnce(mockUrl).mockResolvedValueOnce(null).mockResolvedValueOnce(updated);
      mockRepository.save.mockResolvedValue(updated);

      const result = await service.update('uuid-url-1', { originalUrl: 'https://bing.com' }, 1);

      expect(mockCacheService.del).toHaveBeenCalledWith('url:abc123');
      expect(result).toEqual(updated);
    });

    it('deve lançar ConflictException se nova URL original já cadastrada', async () => {
      const outraUrl = { ...mockUrl, public_id: 'outro-uuid', originalUrl: 'https://bing.com' };
      mockRepository.findOneBy.mockResolvedValueOnce(mockUrl).mockResolvedValueOnce(outraUrl);

      await expect(service.update('uuid-url-1', { originalUrl: 'https://bing.com' }, 1)).rejects.toThrow(ConflictException);
    });
  });

  describe('softDelete', () => {
    it('deve fazer soft delete da URL', async () => {
      mockRepository.findOneBy.mockResolvedValue(mockUrl);
      mockRepository.save.mockResolvedValue(undefined);

      await service.softDelete('uuid-url-1', 1);

      expect(mockRepository.save).toHaveBeenCalledWith(expect.objectContaining({ status: 2 }));
      expect(mockCacheService.del).toHaveBeenCalledWith('url:abc123');
    });

    it('deve lançar NotFoundException se URL não existir', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      await expect(service.softDelete('uuid-inexistente', 1)).rejects.toThrow(NotFoundException);
    });

    it('deve lançar NotFoundException se URL já estiver deletada', async () => {
      mockRepository.findOneBy.mockResolvedValue({ ...mockUrl, status: 2 });

      await expect(service.softDelete('uuid-url-1', 1)).rejects.toThrow(NotFoundException);
    });
  });
});
