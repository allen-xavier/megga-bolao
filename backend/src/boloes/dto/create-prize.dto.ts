import { Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';
import { PrizeType } from '@prisma/client';

export class CreatePrizeDto {
  @IsEnum(PrizeType)
  type: PrizeType;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  percentage?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  fixedValue?: number;

  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  maxWinners?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;
}
