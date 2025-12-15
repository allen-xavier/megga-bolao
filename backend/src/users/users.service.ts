import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: { skip?: number; take?: number; where?: Prisma.UserWhereInput }) {
    const users = await this.prisma.user.findMany({
      skip: params.skip,
      take: params.take,
      where: params.where,
      orderBy: { createdAt: 'desc' },
    });
    return users.map((user) => this.toSafeUser(user));
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    return this.toSafeUser(user);
  }

  async update(id: string, data: UpdateUserDto) {
    await this.findById(id);
    const updateData: Prisma.UserUpdateInput = { ...data };
    if (data.password) {
      updateData.passwordHash = await argon2.hash(data.password);
      delete (updateData as any).password;
    }
    const updated = await this.prisma.user.update({
      where: { id },
      data: updateData,
    });
    return this.toSafeUser(updated);
  }

  async findPrizesForUser(userId: string) {
    const prizes = await this.prisma.prizeResultWinner.findMany({
      where: { userId },
      include: {
        prizeResult: {
          include: {
            bolaoResult: {
              include: { bolao: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return prizes.map((item) => ({
      id: item.id,
      amount: item.amount,
      prizeType: item.prizeResult.prizeType,
      bolaoId: item.prizeResult.bolaoResult.bolaoId,
      bolaoName: item.prizeResult.bolaoResult.bolao.name,
      closedAt: item.prizeResult.bolaoResult.closedAt,
      createdAt: item.createdAt,
    }));
  }

  private toSafeUser(user: any) {
    const { passwordHash, ...safe } = user;
    return safe;
  }
}
