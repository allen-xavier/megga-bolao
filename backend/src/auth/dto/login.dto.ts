import { IsString, Matches, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @Matches(/^\+?\d{10,14}$/)
  phone!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}
