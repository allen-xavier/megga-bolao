import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { UserRole } from '../users/entities/user.entity';

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
    const uniqueFilters: Prisma.UserWhereInput[] = [
      { phone: dto.phone },
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

    const user = await this.prisma.user.create({
      data: {
        fullName: dto.fullName,
        phone: dto.phone,
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
        wallet: {
          create: {},
        },
      },
    });

    return {
      user: this.toSafeUser(user),
      tokens: await this.generateTokens({ sub: user.id, role: user.role }),
    };
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.prisma.user.findUnique({ where: { phone: dto.phone } });

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const isValid = await argon2.verify(user.passwordHash, dto.password);
    if (!isValid) {
      throw new UnauthorizedException('Credenciais inválidas');
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
