import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import type { JwtPayload } from 'src/common/interfaces/jwt.interface';
import { UrlsController } from './urls.controller';
import { UrlsService } from './urls.service';

const mockUrl = {
  public_id: 'uuid-url-1',
  originalUrl: 'https://google.com',
  shortCode: 'abc123',
  clicks: 0,
  status: 1,
  createdAt: new Date('2026-01-01'),
  updatedAt: null,
  disabledAt: null,
};
jest.mock('nanoid', () => ({ nanoid: () => 'abc123' }));

const mockAuthReq = (sub = 1) => ({ user: { sub, username: 'admin' } as JwtPayload }) as any;

const mockUrlsService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  findByShortCode: jest.fn(),
  incrementClicks: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
};

describe('UrlsController', () => {
  let controller: UrlsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UrlsController],
      providers: [{ provide: UrlsService, useValue: mockUrlsService }],
    }).compile();

    controller = module.get<UrlsController>(UrlsController);
    jest.clearAllMocks();
  });

  it('deve estar definido', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /urls — create', () => {
    const dto = { originalUrl: 'https://google.com', shortCode: 'abc123' };

    it('deve criar e retornar a URL encurtada', async () => {
      const created = { ...mockUrl, shortUrl: 'http://localhost:3000/urls/shortCode/abc123' };
      mockUrlsService.create.mockResolvedValue(created);

      const result = await controller.create(mockAuthReq(), dto);

      expect(mockUrlsService.create).toHaveBeenCalledWith(dto, 1);
      expect(result).toHaveProperty('shortUrl');
      expect(result).toHaveProperty('shortCode', 'abc123');
    });

    it('deve lançar ConflictException se URL já foi cadastrada', async () => {
      mockUrlsService.create.mockRejectedValue(new ConflictException('URL já cadastrada anteriormente'));

      await expect(controller.create(mockAuthReq(), dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('GET /urls — findAll', () => {
    it('deve retornar [items, total] com paginação padrão', async () => {
      mockUrlsService.findAll.mockResolvedValue([[mockUrl], 1]);

      const result = await controller.findAll(mockAuthReq(), { limit: 10, page: 1 });

      expect(mockUrlsService.findAll).toHaveBeenCalledWith(1, 10, 1);
      expect(result).toEqual([[mockUrl], 1]);
    });

    it('deve repassar limit e page customizados ao service', async () => {
      mockUrlsService.findAll.mockResolvedValue([[], 0]);

      await controller.findAll(mockAuthReq(), { limit: 5, page: 3 });

      expect(mockUrlsService.findAll).toHaveBeenCalledWith(1, 5, 3);
    });

    it('deve retornar lista vazia quando usuário não tem URLs', async () => {
      mockUrlsService.findAll.mockResolvedValue([[], 0]);

      const result = await controller.findAll(mockAuthReq(), { limit: 10, page: 1 });

      expect(result).toEqual([[], 0]);
    });
  });

  describe('GET /urls/:public_id — findOne', () => {
    it('deve retornar a URL pelo public_id', async () => {
      mockUrlsService.findOne.mockResolvedValue(mockUrl);

      const result = await controller.findOne('uuid-url-1', mockAuthReq());

      expect(mockUrlsService.findOne).toHaveBeenCalledWith('uuid-url-1', 1);
      expect(result).toEqual(mockUrl);
    });

    it('deve lançar NotFoundException se URL não existir', async () => {
      mockUrlsService.findOne.mockRejectedValue(new NotFoundException('URL uuid-inexistente não encontrada'));

      await expect(controller.findOne('uuid-inexistente', mockAuthReq())).rejects.toThrow(NotFoundException);
    });
  });

  describe('GET /urls/shortCode/:shortCode — redirect', () => {
    it('deve redirecionar para a URL original e incrementar cliques', async () => {
      mockUrlsService.findByShortCode.mockResolvedValue({ ...mockUrl, id: 1 });
      mockUrlsService.incrementClicks.mockResolvedValue(undefined);

      const mockRes = { status: jest.fn().mockReturnThis(), redirect: jest.fn() };

      await controller.redirect('abc123', mockRes as any);

      expect(mockUrlsService.findByShortCode).toHaveBeenCalledWith('abc123');
      expect(mockUrlsService.incrementClicks).toHaveBeenCalledWith(1);
      expect(mockRes.status).toHaveBeenCalledWith(301);
      expect(mockRes.redirect).toHaveBeenCalledWith('https://google.com');
    });

    it('deve lançar NotFoundException para shortCode inexistente', async () => {
      mockUrlsService.findByShortCode.mockRejectedValue(new NotFoundException('URL não encontrada'));

      const mockRes = { status: jest.fn().mockReturnThis(), redirect: jest.fn() };

      await expect(controller.redirect('invalido', mockRes as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe('PATCH /urls/:public_id — update', () => {
    it('deve atualizar e retornar a URL', async () => {
      const updated = { ...mockUrl, originalUrl: 'https://bing.com' };
      mockUrlsService.update.mockResolvedValue(updated);

      const result = await controller.update('uuid-url-1', mockAuthReq(), { originalUrl: 'https://bing.com' });

      expect(mockUrlsService.update).toHaveBeenCalledWith('uuid-url-1', { originalUrl: 'https://bing.com' }, 1);
      expect(result).toHaveProperty('originalUrl', 'https://bing.com');
    });

    it('deve lançar NotFoundException se URL não existir', async () => {
      mockUrlsService.update.mockRejectedValue(new NotFoundException('URL uuid-inexistente não encontrada'));

      await expect(controller.update('uuid-inexistente', mockAuthReq(), { originalUrl: 'https://bing.com' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deve lançar ConflictException se nova URL original já estiver cadastrada', async () => {
      mockUrlsService.update.mockRejectedValue(new ConflictException('URL já cadastrada anteriormente'));

      await expect(controller.update('uuid-url-1', mockAuthReq(), { originalUrl: 'https://google.com' })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('DELETE /urls/:public_id — remove (soft delete)', () => {
    it('deve chamar softDelete com public_id e id do usuário logado', async () => {
      mockUrlsService.softDelete.mockResolvedValue(undefined);

      await controller.remove('uuid-url-1', mockAuthReq());

      expect(mockUrlsService.softDelete).toHaveBeenCalledWith('uuid-url-1', 1);
    });

    it('deve lançar NotFoundException se URL não existir', async () => {
      mockUrlsService.softDelete.mockRejectedValue(new NotFoundException('URL uuid-inexistente não encontrada'));

      await expect(controller.remove('uuid-inexistente', mockAuthReq())).rejects.toThrow(NotFoundException);
    });

    it('deve lançar NotFoundException se URL já estiver deletada', async () => {
      mockUrlsService.softDelete.mockRejectedValue(new NotFoundException('URL uuid-url-1 já está deletada'));

      await expect(controller.remove('uuid-url-1', mockAuthReq())).rejects.toThrow(NotFoundException);
    });
  });
});
