import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, type TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

const mockUser = {
  id: 1,
  public_id: 'uuid-mock-1',
  firstName: 'Admin',
  lastName: 'User',
  userName: 'admin',
  email: 'admin@email.com',
  password: 'hashed_password',
  status: 1,
  createdAt: new Date('2026-01-01'),
  updatedAt: null,
  disabledAt: null,
};

const mockUsersService = {
  findOneUsername: jest.fn(),
};

const mockJwtService = {
  signAsync: jest.fn(),
};

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('signIn', () => {
    const dto = { userName: 'admin', password: '123' };

    it('deve retornar access_token com credenciais válidas', async () => {
      mockUsersService.findOneUsername.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.signAsync.mockResolvedValue('jwt.token.aqui');

      const result = await service.signIn(dto);

      expect(mockUsersService.findOneUsername).toHaveBeenCalledWith('admin');
      expect(mockJwtService.signAsync).toHaveBeenCalledWith({ sub: 1, username: 'admin' });
      expect(result).toEqual({ access_token: 'jwt.token.aqui' });
    });

    it('deve lançar UnauthorizedException se senha estiver errada', async () => {
      mockUsersService.findOneUsername.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.signIn({ ...dto, password: 'errada' })).rejects.toThrow(UnauthorizedException);
    });

    it('deve lançar UnauthorizedException se usuário estiver inativo (status 2)', async () => {
      mockUsersService.findOneUsername.mockResolvedValue({ ...mockUser, status: 2 });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(service.signIn(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('deve lançar UnauthorizedException se usuário não for encontrado', async () => {
      mockUsersService.findOneUsername.mockRejectedValue(new UnauthorizedException());

      await expect(service.signIn(dto)).rejects.toThrow(UnauthorizedException);
    });
  });
});
