import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import type { Repository } from 'typeorm';
import type { CreateUserDto } from './dto/create-user.dto';
import type { UpdateUserDto } from './dto/update-user.dto';
import { Users } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,
  ) {}

  async create(createUserDto: CreateUserDto, idUser: number) {
    const emailExists = await this.usersRepository.findOneBy({ email: createUserDto.email });
    if (emailExists) throw new ConflictException('E-mail já está em uso');

    const userNameExists = await this.usersRepository.findOneBy({ userName: createUserDto.userName });
    if (userNameExists) throw new ConflictException('Nome de usuário já está em uso');

    const saltOrRounds = 10;
    const hashedPassword = await bcrypt.hash(createUserDto.password, saltOrRounds);

    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
      createdBy: { id: idUser },
    });

    const savedUser = await this.usersRepository.save(user);
    const { id, password, createdBy, ...result } = savedUser;
    return result;
  }

  async findAll() {
    const users = await this.usersRepository.find();
    return users.map(({ id, password, ...result }) => result);
  }

  async findOneUsername(userName: string) {
    const user = await this.usersRepository.findOneBy({ userName });
    if (!user) throw new NotFoundException(`Usuário "${userName}" não encontrado`);
    return user;
  }

  async findById(id: number) {
    return this.usersRepository.findOneBy({ id });
  }

  async update(userName: string, updateUserDto: UpdateUserDto, idUser: number) {
    const user = await this.usersRepository.findOneBy({ userName });

    if (!user) throw new NotFoundException(`Usuário ${userName} não encontrado`);

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const emailExists = await this.usersRepository.findOneBy({ email: updateUserDto.email });
      if (emailExists) throw new ConflictException('E-mail já está em uso');
    }

    if (updateUserDto.userName && updateUserDto.userName !== user.userName) {
      const userNameExists = await this.usersRepository.findOneBy({ userName: updateUserDto.userName });
      if (userNameExists) throw new ConflictException('Nome de usuário já está em uso');
    }

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    const updated = this.usersRepository.merge(user, {
      ...updateUserDto,
      updatedBy: { id: idUser },
      updatedAt: new Date(),
    });

    const savedUser = await this.usersRepository.save(updated);
    const { id, password, createdBy, updatedBy, ...result } = savedUser;
    return result;
  }

  async softDelete(userName: string, idUser: number) {
    const user = await this.usersRepository.findOneBy({ userName });

    if (!user) throw new NotFoundException(`Usuário ${userName} não encontrado`);

    if (user.status === 2) throw new NotFoundException(`Usuário ${userName} já está deletado`);

    await this.usersRepository.save({
      ...user,
      status: 2,
      disabledAt: new Date(),
      deletedBy: { id: idUser },
    });
  }
}
