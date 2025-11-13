import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class RequestDepositDto {
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsOptional()
  @IsString()
  reference?: string;
}
