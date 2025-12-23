import { IsOptional, IsString } from 'class-validator';

export class UpdateWithdrawDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
