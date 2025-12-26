import { IsBoolean, IsEmail, IsEnum, IsIn, IsOptional, IsString, Length, Matches } from 'class-validator';
import { UserRole } from '../../users/entities/user.entity';
import { PIX_KEY_TYPES } from '../../common/user-validation';

export class RegisterUserDto {
  @IsString()
  fullName!: string;

  @IsString()
  @Matches(/^\+?\d{10,14}$/)
  phone!: string;

  @IsString()
  cpf!: string;

  @IsString()
  cep!: string;

  @IsString()
  address!: string;

  @IsString()
  addressNumber!: string;

  @IsOptional()
  @IsString()
  addressComplement?: string;

  @IsString()
  city!: string;

  @IsString()
  state!: string;

  @IsString()
  pixKey!: string;

  @IsString()
  @IsIn(PIX_KEY_TYPES)
  pixKeyType!: (typeof PIX_KEY_TYPES)[number];

  @IsString()
  @Length(6, 50)
  password!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole = UserRole.USER;

  @IsOptional()
  @IsBoolean()
  acceptedTerms?: boolean = false;

  @IsOptional()
  @IsString()
  referralCode?: string;
}
