import { ArrayMaxSize, ArrayMinSize, IsArray, IsDateString, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateDrawDto {
  @IsDateString()
  drawnAt: string;

  @IsArray()
  @ArrayMinSize(6)
  @ArrayMaxSize(6)
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(60, { each: true })
  numbers: number[];

  @IsOptional()
  @IsString()
  notes?: string;
}
