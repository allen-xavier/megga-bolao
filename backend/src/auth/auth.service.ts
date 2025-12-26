import { BadRequestException, ConflictException, Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { Prisma, User, PaymentType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { UserRole } from '../users/entities/user.entity';
import { randomUUID } from 'crypto';
import {
  PIX_KEY_TYPES,
  normalizeCep,
  normalizeCpf,
  normalizeEmail,
  normalizeName,
  normalizePhone,
  normalizePixKey,
  isValidCpf,
} from '../common/user-validation';

interface AuthPayload {
  sub: string;
  role: UserRole;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult {
  user: SafeUser;
  tokens: AuthTokens;
}

type SafeUser = Omit<User, 'passwordHash'>;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterUserDto): Promise<AuthResult> {
    const normalizedPhone = normalizePhone(dto.phone);
    const normalizedEmail = normalizeEmail(dto.email);
    const normalizedCpf = normalizeCpf(dto.cpf);
    const normalizedCep = normalizeCep(dto.cep);
    const normalizedName = normalizeName(dto.fullName);
    const normalizedAddress = normalizeName(dto.address);
    const normalizedAddressNumber = normalizeName(dto.addressNumber);
    const normalizedAddressComplement = dto.addressComplement ? normalizeName(dto.addressComplement) : undefined;
    const normalizedCity = normalizeName(dto.city);
    const normalizedState = normalizeName(dto.state);
    const pixKeyType = (dto.pixKeyType ?? 'document') as (typeof PIX_KEY_TYPES)[number];

    if (!isValidCpf(normalizedCpf)) {
      throw new BadRequestException('CPF invalido.');
    }
    if (normalizedCep.length !== 8) {
      throw new BadRequestException('CEP invalido.');
    }
    if (!normalizedAddressNumber) {
      throw new BadRequestException('Numero do endereco obrigatorio.');
    }

    const pixKeyResult = normalizePixKey(pixKeyType, dto.pixKey, {
      cpf: normalizedCpf,
      phone: normalizedPhone,
      email: normalizedEmail,
    });
    if (!pixKeyResult.valid) {
      throw new BadRequestException(pixKeyResult.message ?? 'Chave Pix invalida.');
    }

    const uniqueFilters: Prisma.UserWhereInput[] = [
      { phone: normalizedPhone },
      { cpf: normalizedCpf },
    ];

    if (normalizedEmail) {
      uniqueFilters.push({ email: normalizedEmail });
    }

    const existing = await this.prisma.user.findFirst({
      where: {
        OR: uniqueFilters,
      },
    });

    if (existing) {
      throw new ConflictException('Usuario com telefone, CPF ou e-mail ja cadastrado');
    }

    const passwordHash = await argon2.hash(dto.password);

    const inviteCode = dto.referralCode?.trim() || undefined;
    let user: User | null = null;
    let attempts = 0;
    while (!user && attempts < 10) {
      attempts += 1;
      const base = randomUUID().replace(/-/g, '');
      const referralCode = `ref_${base.slice(0, 16)}`;
      try {
        user = await this.prisma.user.create({
          data: {
            fullName: normalizedName,
            phone: normalizedPhone,
            cpf: normalizedCpf,
            email: normalizedEmail,
            cep: normalizedCep,
            address: normalizedAddress,
            addressNumber: normalizedAddressNumber,
            addressComplement: normalizedAddressComplement,
            city: normalizedCity,
            state: normalizedState,
            pixKey: pixKeyResult.value ?? dto.pixKey,
            pixKeyType,
            passwordHash,
            role: dto.role ?? UserRole.USER,
            acceptedTerms: dto.acceptedTerms ?? false,
            referralCode,
            wallet: {
              create: {
                balance: 1000, // saldo ficticio para testes
                statements: {
                  create: {
                    amount: 1000,
                    description: 'Cr\u00e9dito inicial de teste',
                    type: PaymentType.DEPOSIT,
                  },
                },
              },
            },
          },
        });
      } catch (err: any) {
        if (err?.code === 'P2002' && err?.meta?.target?.includes('referralCode')) {
          continue;
        }
        throw err;
      }
    }

    if (!user) {
      throw new ConflictException('Nao foi possivel gerar codigo de convite unico. Tente novamente.');
    }

    await this.linkReferrals(user.id, inviteCode);

    return {
      user: this.toSafeUser(user),
      tokens: await this.generateTokens({ sub: user.id, role: user.role }),
    };
  }

  async checkAvailability(params: { cpf?: string; email?: string; phone?: string; excludeId?: string }) {
    const normalizedCpf = params.cpf ? normalizeCpf(params.cpf) : undefined;
    const normalizedEmail = params.email ? normalizeEmail(params.email) : undefined;
    const normalizedPhone = params.phone ? normalizePhone(params.phone) : undefined;

    if (!normalizedCpf && !normalizedEmail && !normalizedPhone) {
      throw new BadRequestException('Informe CPF, email ou telefone para verificar.');
    }

    if (normalizedCpf && !isValidCpf(normalizedCpf)) {
      throw new BadRequestException('CPF invalido.');
    }
    if (params.email && !normalizedEmail) {
      throw new BadRequestException('Email invalido.');
    }
    if (normalizedPhone) {
      const phoneDigits = normalizedPhone.replace(/\D/g, '');
      if (phoneDigits.length < 10 || phoneDigits.length > 14) {
        throw new BadRequestException('Telefone invalido.');
      }
    }

    const filters: Prisma.UserWhereInput[] = [];
    if (normalizedCpf) {
      filters.push({ cpf: normalizedCpf });
    }
    if (normalizedEmail) {
      filters.push({ email: normalizedEmail });
    }
    if (normalizedPhone) {
      filters.push({ phone: normalizedPhone });
    }

    const existing = await this.prisma.user.findFirst({
      where: {
        OR: filters,
        ...(params.excludeId ? { NOT: { id: params.excludeId } } : {}),
      },
    });

    if (existing) {
      if (normalizedCpf && existing.cpf === normalizedCpf) {
        throw new ConflictException('CPF ja cadastrado.');
      }
      if (normalizedEmail && existing.email === normalizedEmail) {
        throw new ConflictException('Email ja cadastrado.');
      }
      if (normalizedPhone && existing.phone === normalizedPhone) {
        throw new ConflictException('Telefone ja cadastrado.');
      }
      throw new ConflictException('Dados ja cadastrados.');
    }

    return { available: true };
  }
  private async linkReferrals(newUserId: string, inviteCode?: string) {
    if (!inviteCode) return;
    const referrer = await this.prisma.user.findUnique({ where: { referralCode: inviteCode } });
    if (!referrer) return;

    // Nível 1 - só cria se não existir
    const existsLevel1 = await this.prisma.referral.findFirst({
      where: { referredUserId: newUserId, level: 1 },
    });
    if (!existsLevel1) {
      await this.prisma.referral.create({
        data: {
          userId: referrer.id,
          referredUserId: newUserId,
          level: 1,
        },
      });
    }

    // Nível 2 (pega quem indicou o referrer, qualquer nível)
    const referrerRef = await this.prisma.referral.findFirst({
      where: { referredUserId: referrer.id },
    });
    if (referrerRef) {
      const existsLevel2 = await this.prisma.referral.findFirst({
        where: { referredUserId: newUserId, level: 2 },
      });
      if (!existsLevel2) {
        await this.prisma.referral.create({
          data: {
            userId: referrerRef.userId,
            referredUserId: newUserId,
            level: 2,
          },
        });
      }
    }
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const normalizedPhone = normalizePhone(dto.phone);
    const user = await this.prisma.user.findUnique({ where: { phone: normalizedPhone } });

    if (!user) {
      throw new NotFoundException('Usuario nao encontrado');
    }

    const isValid = await argon2.verify(user.passwordHash, dto.password);
    if (!isValid) {
      throw new UnauthorizedException('Credenciais invalidas');
    }

    return {
      user: this.toSafeUser(user),
      tokens: await this.generateTokens({ sub: user.id, role: user.role }),
    };
  }

  async refresh(dto: RefreshTokenDto): Promise<AuthResult> {
    try {
      const payload = await this.jwtService.verifyAsync<AuthPayload>(dto.refreshToken, {
        secret: this.config.get<string>('jwt.refreshSecret'),
      });
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) {
        throw new UnauthorizedException('Usuário não encontrado');
      }
      return {
        user: this.toSafeUser(user),
        tokens: await this.generateTokens({ sub: user.id, role: user.role }),
      };
    } catch (error) {
      throw new UnauthorizedException('Token inválido ou expirado');
    }
  }

  private async generateTokens(payload: AuthPayload): Promise<AuthTokens> {
    const accessToken = await this.jwtService.signAsync(payload);
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.config.get<string>('jwt.refreshSecret'),
      expiresIn: `${this.config.get<number>('jwt.refreshTtl')}s`,
    });

    return { accessToken, refreshToken };
  }

  private toSafeUser(user: User): SafeUser {
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }
}


