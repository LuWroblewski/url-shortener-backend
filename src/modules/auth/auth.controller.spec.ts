import { UnauthorizedException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

const mockAuthService = {
  signIn: jest.fn(),
};

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    jest.clearAllMocks();
  });

  it('deve estar definido', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /auth — create (signIn)', () => {
    it('deve retornar access_token com credenciais válidas', async () => {
      const dto = { userName: 'admin', password: '123' };
      const token = { access_token: 'jwt.token.aqui' };

      mockAuthService.signIn.mockResolvedValue(token);

      const result = await controller.create(dto);

      expect(mockAuthService.signIn).toHaveBeenCalledWith(dto);
      expect(result).toEqual(token);
    });

    it('deve lançar UnauthorizedException com credenciais inválidas', async () => {
      const dto = { userName: 'admin', password: 'errada' };

      mockAuthService.signIn.mockRejectedValue(new UnauthorizedException('Invalid credentials'));

      await expect(controller.create(dto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('GET /auth/verify', () => {
    it('deve retornar { valid: true }', () => {
      const result = controller.verify();
      expect(result).toEqual({ valid: true });
    });
  });
});
