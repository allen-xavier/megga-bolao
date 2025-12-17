import { ConflictException, Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { UserRole } from '../users/entities/user.entity';
import { randomUUID } from 'crypto';

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

  private normalizePhone(phone: string): string {
    if (!phone) {
      return '';
    }

    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('55') && digits.length === 13) {
      return `+${digits}`;
    }
    if (digits.length === 11) {
      // Assume BR number without country code
      return `+55${digits}`;
    }
    if (phone.startsWith('+')) {
      return phone;
    }
    return `+${digits}`;
  }

  async register(dto: RegisterUserDto): Promise<AuthResult> {
    const normalizedPhone = this.normalizePhone(dto.phone);

    const uniqueFilters: Prisma.UserWhereInput[] = [
      { phone: normalizedPhone },
      { cpf: dto.cpf },
    ];

    if (dto.email) {
      uniqueFilters.push({ email: dto.email });
    }

    const existing = await this.prisma.user.findFirst({
      where: {
        OR: uniqueFilters,
      },
    });

    if (existing) {
      throw new ConflictException('Usuário com telefone, CPF ou e-mail já cadastrado');
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
            fullName: dto.fullName,
            phone: normalizedPhone,
            cpf: dto.cpf,
            email: dto.email,
            cep: dto.cep,
            address: dto.address,
            city: dto.city,
            state: dto.state,
            pixKey: dto.pixKey,
            passwordHash,
            role: dto.role ?? UserRole.USER,
            acceptedTerms: dto.acceptedTerms ?? false,
            referralCode,
            wallet: {
              create: {},
            },
          },
        });
      } catch (err: any) {
        if (err?.code === 'P2002' && err?.meta?.target?.includes('referralCode')) {
          continue; // tenta gerar outro
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

  private async linkReferrals(newUserId: string, inviteCode?: string) {
    if (!inviteCode) return;
    const referrer = await this.prisma.user.findUnique({ where: { referralCode: inviteCode } });
    if (!referrer) return;

    // Nível 1
    await this.prisma.referral.create({
      data: {
        userId: referrer.id,
        referredUserId: newUserId,
        level: 1,
      },
    });

    // Nível 2 (se o referrer tiver um referrer)
    const referrerRef = await this.prisma.referral.findFirst({
      where: { referredUserId: referrer.id, level: 1 },
    });
    if (referrerRef) {
      await this.prisma.referral.create({
        data: {
          userId: referrerRef.userId,
          referredUserId: newUserId,
          level: 2,
        },
      });
    }
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const normalizedPhone = this.normalizePhone(dto.phone);
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
