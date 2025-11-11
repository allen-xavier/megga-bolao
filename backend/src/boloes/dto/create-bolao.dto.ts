import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { CreatePrizeDto } from './create-prize.dto';

export class CreateBolaoDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsDateString()
  startsAt: string;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  ticketPrice: number;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  minimumQuotas: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  guaranteedPrize?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  commissionPercent?: number;

  @IsOptional()
  @IsBoolean()
  promotional?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePrizeDto)
  prizes: CreatePrizeDto[];
}
