import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Users } from './entities/user.entity';
import { UsersService } from './users.service';

const mockUser = {
  id: 1,
  public_id: 'uuid-mock-1',
  firstName: 'João',
  lastName: 'Silva',
  userName: 'joaosilva',
  email: 'joao@email.com',
  password: 'hashed_password',
  status: 1,
  createdAt: new Date('2026-01-01'),
  updatedAt: null,
  disabledAt: null,
  createdBy: null,
  updatedBy: null,
  deletedBy: null,
};

const mockRepository = {
  findOneBy: jest.fn(),
  findAndCount: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  merge: jest.fn(),
};

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: getRepositoryToken(Users), useValue: mockRepository }],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const dto = {
      firstName: 'João',
      lastName: 'Silva',
      userName: 'joaosilva',
      email: 'joao@email.com',
      password: 'Test@1234',
    };

    it('deve criar usuário e retornar sem id e senha', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      mockRepository.create.mockReturnValue(mockUser);
      mockRepository.save.mockResolvedValue(mockUser);

      const result = await service.create(dto, 1);

      expect(result).not.toHaveProperty('id');
      expect(result).not.toHaveProperty('password');
    });

    it('deve lançar ConflictException se e-mail já estiver em uso', async () => {
      mockRepository.findOneBy.mockResolvedValueOnce(mockUser);

      await expect(service.create(dto, 1)).rejects.toThrow(ConflictException);
    });

    it('deve lançar ConflictException se username já estiver em uso', async () => {
      mockRepository.findOneBy.mockResolvedValueOnce(null).mockResolvedValueOnce(mockUser);

      await expect(service.create(dto, 1)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('deve retornar [items, total] sem id e senha', async () => {
      mockRepository.findAndCount.mockResolvedValue([[mockUser], 1]);

      const [items, total] = await service.findAll(10, 1);

      expect(total).toBe(1);
      expect(items[0]).not.toHaveProperty('id');
      expect(items[0]).not.toHaveProperty('password');
    });

    it('deve retornar lista vazia quando não há usuários', async () => {
      mockRepository.findAndCount.mockResolvedValue([[], 0]);

      const [items, total] = await service.findAll(10, 1);

      expect(items).toHaveLength(0);
      expect(total).toBe(0);
    });

    it('deve repassar take e skip corretos ao repositório', async () => {
      mockRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll(5, 3);

      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        take: 5,
        skip: 10,
      });
    });
  });

  describe('findOneUsername', () => {
    it('deve retornar o usuário encontrado', async () => {
      mockRepository.findOneBy.mockResolvedValue(mockUser);

      const result = await service.findOneUsername('joaosilva');

      expect(result).toEqual(mockUser);
    });

    it('deve lançar NotFoundException se usuário não existir', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      await expect(service.findOneUsername('inexistente')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findById', () => {
    it('deve retornar o usuário pelo id', async () => {
      mockRepository.findOneBy.mockResolvedValue(mockUser);

      const result = await service.findById(1);

      expect(result).toEqual(mockUser);
      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
    });

    it('deve retornar null se usuário não existir', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      const result = await service.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('deve atualizar e retornar o usuário sem campos sensíveis', async () => {
      const updated = { ...mockUser, firstName: 'João Atualizado' };
      mockRepository.findOneBy.mockResolvedValue(mockUser);
      mockRepository.merge.mockReturnValue(updated);
      mockRepository.save.mockResolvedValue(updated);

      const result = await service.update('joaosilva', { firstName: 'João Atualizado' }, 1);

      expect(result).not.toHaveProperty('id');
      expect(result).not.toHaveProperty('password');
    });

    it('deve lançar NotFoundException se usuário não existir', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      await expect(service.update('inexistente', {}, 1)).rejects.toThrow(NotFoundException);
    });

    it('deve lançar ConflictException se novo e-mail já estiver em uso', async () => {
      mockRepository.findOneBy
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce({ ...mockUser, id: 2, email: 'outro@email.com' });

      await expect(service.update('joaosilva', { email: 'outro@email.com' }, 1)).rejects.toThrow(ConflictException);
    });

    it('deve lançar ConflictException se novo username já estiver em uso', async () => {
      mockRepository.findOneBy
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce({ ...mockUser, id: 2, userName: 'outrouser' });

      await expect(service.update('joaosilva', { userName: 'outrouser' }, 1)).rejects.toThrow(ConflictException);
    });

    it('deve fazer hash da senha se ela for atualizada', async () => {
      mockRepository.findOneBy.mockResolvedValue(mockUser);
      mockRepository.merge.mockReturnValue(mockUser);
      mockRepository.save.mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('nova_senha_hashed');

      await service.update('joaosilva', { password: 'nova123' }, 1);

      expect(bcrypt.hash).toHaveBeenCalledWith('nova123', 10);
    });
  });

  describe('softDelete', () => {
    it('deve fazer soft delete do usuário', async () => {
      mockRepository.findOneBy.mockResolvedValue(mockUser);
      mockRepository.save.mockResolvedValue(undefined);

      await service.softDelete('joaosilva', 1);

      expect(mockRepository.save).toHaveBeenCalledWith(expect.objectContaining({ status: 2 }));
    });

    it('deve lançar NotFoundException se usuário não existir', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      await expect(service.softDelete('inexistente', 1)).rejects.toThrow(NotFoundException);
    });

    it('deve lançar NotFoundException se usuário já estiver deletado', async () => {
      mockRepository.findOneBy.mockResolvedValue({ ...mockUser, status: 2 });

      await expect(service.softDelete('joaosilva', 1)).rejects.toThrow(NotFoundException);
    });
  });
});
