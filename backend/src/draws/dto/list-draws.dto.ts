import { IsDateString, IsOptional } from 'class-validator';

export class ListDrawsDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
