import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, Length, Matches } from 'class-validator';
import { UserRole } from '../../users/entities/user.entity';

export class RegisterUserDto {
  @IsString()
  fullName!: string;

  @IsString()
  @Matches(/^\+?\d{10,14}$/)
  phone!: string;

  @IsString()
  @Matches(/^\d{11}$/)
  cpf!: string;

  @IsString()
  cep!: string;

  @IsString()
  address!: string;

  @IsString()
  city!: string;

  @IsString()
  state!: string;

  @IsString()
  pixKey!: string;

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
}
