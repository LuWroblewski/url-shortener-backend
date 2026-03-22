import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import type { JwtPayload } from 'src/common/interfaces/jwt.interface';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

const mockUser = {
  public_id: 'uuid-mock-1',
  firstName: 'João',
  lastName: 'Silva',
  userName: 'joaosilva',
  email: 'joao@email.com',
  status: 1,
  createdAt: new Date('2026-01-01'),
  updatedAt: null,
  disabledAt: null,
};

const mockAuthReq = (sub = 1) => ({ user: { sub, username: 'admin' } as JwtPayload }) as any;

const mockUsersService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOneUsername: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
};

describe('UsersController', () => {
  let controller: UsersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    jest.clearAllMocks();
  });

  it('deve estar definido', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /users — create', () => {
    const dto = {
      firstName: 'João',
      lastName: 'Silva',
      userName: 'joaosilva',
      email: 'joao@email.com',
      password: 'Test@1234',
    };

    it('deve criar e retornar o usuário sem senha', async () => {
      mockUsersService.create.mockResolvedValue(mockUser);

      const result = await controller.create(mockAuthReq(), dto);

      expect(mockUsersService.create).toHaveBeenCalledWith(dto, 1);
      expect(result).toEqual(mockUser);
    });

    it('deve lançar ConflictException se e-mail já estiver em uso', async () => {
      mockUsersService.create.mockRejectedValue(new ConflictException('E-mail já está em uso'));

      await expect(controller.create(mockAuthReq(), dto)).rejects.toThrow(ConflictException);
    });

    it('deve lançar ConflictException se username já estiver em uso', async () => {
      mockUsersService.create.mockRejectedValue(new ConflictException('Nome de usuário já está em uso'));

      await expect(controller.create(mockAuthReq(), dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('GET /users — findAll', () => {
    it('deve retornar [items, total] com paginação padrão', async () => {
      mockUsersService.findAll.mockResolvedValue([[mockUser], 1]);

      const result = await controller.findAll({ limit: 10, page: 1 });

      expect(mockUsersService.findAll).toHaveBeenCalledWith(10, 1);
      expect(result).toEqual([[mockUser], 1]);
    });

    it('deve repassar limit e page customizados ao service', async () => {
      mockUsersService.findAll.mockResolvedValue([[], 0]);

      await controller.findAll({ limit: 5, page: 2 });

      expect(mockUsersService.findAll).toHaveBeenCalledWith(5, 2);
    });

    it('deve retornar lista vazia quando não há usuários', async () => {
      mockUsersService.findAll.mockResolvedValue([[], 0]);

      const result = await controller.findAll({ limit: 10, page: 1 });

      expect(result).toEqual([[], 0]);
    });
  });

  describe('GET /users/:username — findOneByUsername', () => {
    it('deve retornar o usuário sem id e senha', async () => {
      mockUsersService.findOneUsername.mockResolvedValue({
        id: 1,
        password: 'hashed',
        ...mockUser,
      });

      const result = await controller.findOneByUsername('joaosilva');

      expect(mockUsersService.findOneUsername).toHaveBeenCalledWith('joaosilva');
      expect(result).not.toHaveProperty('id');
      expect(result).not.toHaveProperty('password');
      expect(result).toHaveProperty('userName', 'joaosilva');
    });

    it('deve lançar NotFoundException se usuário não existir', async () => {
      mockUsersService.findOneUsername.mockRejectedValue(new NotFoundException('Usuário "inexistente" não encontrado'));

      await expect(controller.findOneByUsername('inexistente')).rejects.toThrow(NotFoundException);
    });
  });

  describe('PATCH /users/:username — update', () => {
    it('deve atualizar e retornar o usuário', async () => {
      const updated = { ...mockUser, firstName: 'João Atualizado' };
      mockUsersService.update.mockResolvedValue(updated);

      const result = await controller.update('joaosilva', mockAuthReq(), { firstName: 'João Atualizado' });

      expect(mockUsersService.update).toHaveBeenCalledWith('joaosilva', { firstName: 'João Atualizado' }, 1);
      expect(result).toEqual(updated);
    });

    it('deve lançar NotFoundException se usuário não existir', async () => {
      mockUsersService.update.mockRejectedValue(new NotFoundException('Usuário inexistente não encontrado'));

      await expect(controller.update('inexistente', mockAuthReq(), {})).rejects.toThrow(NotFoundException);
    });

    it('deve lançar ConflictException se novo e-mail já estiver em uso', async () => {
      mockUsersService.update.mockRejectedValue(new ConflictException('E-mail já está em uso'));

      await expect(controller.update('joaosilva', mockAuthReq(), { email: 'outro@email.com' })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('DELETE /users/:username — remove (soft delete)', () => {
    it('deve chamar softDelete com username e id do usuário logado', async () => {
      mockUsersService.softDelete.mockResolvedValue(undefined);

      await controller.remove('joaosilva', mockAuthReq());

      expect(mockUsersService.softDelete).toHaveBeenCalledWith('joaosilva', 1);
    });

    it('deve lançar NotFoundException se usuário não existir', async () => {
      mockUsersService.softDelete.mockRejectedValue(new NotFoundException('Usuário inexistente não encontrado'));

      await expect(controller.remove('inexistente', mockAuthReq())).rejects.toThrow(NotFoundException);
    });

    it('deve lançar NotFoundException se usuário já estiver deletado', async () => {
      mockUsersService.softDelete.mockRejectedValue(new NotFoundException('Usuário joaosilva já está deletado'));

      await expect(controller.remove('joaosilva', mockAuthReq())).rejects.toThrow(NotFoundException);
    });
  });
});
