import { type CanActivate, type ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { UsersService } from 'src/modules/users/users.service';
import type { JwtPayload } from '../interfaces/jwt.interface';
import { IS_PUBLIC_KEY } from './public.decorator';

type AuthenticatedRequest = Request & { user: JwtPayload };

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (this.isPublic(context)) return true;

    const token = this.extractTokenFromHeader(request);
    if (!token) throw new UnauthorizedException();

    const payload = await this.jwtService.verifyAsync<JwtPayload>(token, { secret: process.env.JWT_SECRET }).catch(() => {
      throw new UnauthorizedException();
    });

    const user = await this.usersService.findById(payload.sub);
    if (!user || user.status === 2) throw new UnauthorizedException();

    request.user = payload;
    return true;
  }

  private isPublic(context: ExecutionContext): boolean {
    return this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]);
  }

  private extractTokenFromHeader({ headers }: Request): string | undefined {
    const [type, token] = headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
