import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  PIX_KEY_TYPES,
  normalizeCep,
  normalizeCpf,
  normalizeEmail,
  normalizeName,
  normalizePixKey,
  normalizePhone,
  isValidCpf,
} from '../common/user-validation';

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
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Usuario nao encontrado');
    }
    const updateData: Prisma.UserUpdateInput = { ...data };
    const normalizedPhone = typeof data.phone === 'string' ? normalizePhone(data.phone) : undefined;
    const normalizedEmail = typeof data.email === 'string' ? normalizeEmail(data.email) ?? undefined : undefined;
    const normalizedCpf = typeof data.cpf === 'string' ? normalizeCpf(data.cpf) : undefined;
    if (data.password) {
      updateData.passwordHash = await argon2.hash(data.password);
      delete (updateData as any).password;
    }
    if (typeof data.fullName === 'string') {
      updateData.fullName = normalizeName(data.fullName);
    }
    if (typeof data.phone === 'string') {
      updateData.phone = normalizedPhone;
    }
    if (typeof data.email === 'string') {
      updateData.email = normalizedEmail;
    }
    if (typeof data.cpf === 'string') {
      if (!normalizedCpf || !isValidCpf(normalizedCpf)) {
        throw new BadRequestException('CPF invalido.');
      }
      updateData.cpf = normalizedCpf;
    }
    if (typeof data.cep === 'string') {
      const normalizedCep = normalizeCep(data.cep);
      if (normalizedCep.length !== 8) {
        throw new BadRequestException('CEP invalido.');
      }
      updateData.cep = normalizedCep;
    }
    if (typeof data.address === 'string') {
      updateData.address = normalizeName(data.address);
    }
    if (typeof data.addressNumber === 'string') {
      const normalizedNumber = normalizeName(data.addressNumber);
      if (!normalizedNumber) {
        throw new BadRequestException('Numero do endereco obrigatorio.');
      }
      updateData.addressNumber = normalizedNumber;
    }
    if (typeof data.addressComplement === 'string') {
      const normalizedComplement = normalizeName(data.addressComplement);
      updateData.addressComplement = normalizedComplement || null;
    }
    if (typeof data.city === 'string') {
      updateData.city = normalizeName(data.city);
    }
    if (typeof data.state === 'string') {
      updateData.state = normalizeName(data.state);
    }
    if (typeof data.pixKeyType === 'string') {
      const pixKeyType = data.pixKeyType as (typeof PIX_KEY_TYPES)[number];
      updateData.pixKeyType = pixKeyType;
    }
    const uniqueFilters: Prisma.UserWhereInput[] = [];
    if (normalizedPhone && normalizedPhone !== existing.phone) {
      uniqueFilters.push({ phone: normalizedPhone });
    }
    if (normalizedCpf && normalizedCpf !== existing.cpf) {
      uniqueFilters.push({ cpf: normalizedCpf });
    }
    if (normalizedEmail && normalizedEmail !== existing.email) {
      uniqueFilters.push({ email: normalizedEmail });
    }
    if (uniqueFilters.length > 0) {
      const conflict = await this.prisma.user.findFirst({
        where: {
          OR: uniqueFilters,
          NOT: { id },
        },
      });
      if (conflict) {
        if (normalizedCpf && conflict.cpf === normalizedCpf) {
          throw new ConflictException('CPF ja cadastrado.');
        }
        if (normalizedEmail && conflict.email === normalizedEmail) {
          throw new ConflictException('Email ja cadastrado.');
        }
        if (normalizedPhone && conflict.phone === normalizedPhone) {
          throw new ConflictException('Telefone ja cadastrado.');
        }
        throw new ConflictException('Dados ja cadastrados.');
      }
    }

    if (typeof data.pixKey === 'string' || typeof data.pixKeyType === 'string') {
      const pixKeyType = (data.pixKeyType ?? existing.pixKeyType ?? 'document') as (typeof PIX_KEY_TYPES)[number];
      const pixKey = typeof data.pixKey === 'string' ? data.pixKey : existing.pixKey;
      const pixCpf = normalizeCpf(typeof data.cpf === 'string' ? data.cpf : existing.cpf);
      const pixEmail = normalizeEmail(typeof data.email === 'string' ? data.email : existing.email);
      const pixKeyResult = normalizePixKey(pixKeyType, pixKey, {
        cpf: pixCpf,
        phone: existing.phone,
        email: pixEmail,
      });
      if (!pixKeyResult.valid) {
        throw new BadRequestException(pixKeyResult.message ?? 'Chave Pix invalida.');
      }
      updateData.pixKey = pixKeyResult.value ?? pixKey;
      updateData.pixKeyType = pixKeyType;
    }
    try {
      const updated = await this.prisma.user.update({
        where: { id },
        data: updateData,
      });
      return this.toSafeUser(updated);
    } catch (err: any) {
      if (err?.code === 'P2002') {
        const target = Array.isArray(err?.meta?.target) ? err.meta.target : [];
        if (target.includes('cpf')) {
          throw new ConflictException('CPF ja cadastrado.');
        }
        if (target.includes('email')) {
          throw new ConflictException('Email ja cadastrado.');
        }
        if (target.includes('phone')) {
          throw new ConflictException('Telefone ja cadastrado.');
        }
        throw new ConflictException('Dados ja cadastrados.');
      }
      throw err;
    }
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

  async remove(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const betCount = await this.prisma.bet.count({ where: { userId: id } });
    const paymentCount = await this.prisma.payment.count({ where: { userId: id } });
    const prizeCount = await this.prisma.prizeResultWinner.count({ where: { userId: id } });

    if (betCount > 0 || paymentCount > 0 || prizeCount > 0) {
      throw new BadRequestException('Não é possível excluir usuário com histórico de apostas ou pagamentos.');
    }

    await this.prisma.$transaction([
      this.prisma.referral.deleteMany({ where: { OR: [{ userId: id }, { referredUserId: id }] } }),
      this.prisma.walletStatement.deleteMany({ where: { wallet: { userId: id } } }),
      this.prisma.wallet.deleteMany({ where: { userId: id } }),
      this.prisma.user.delete({ where: { id } }),
    ]);

    return { deleted: true };
  }
}
