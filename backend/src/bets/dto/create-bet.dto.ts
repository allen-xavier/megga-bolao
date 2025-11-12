import { ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsOptional, IsInt, Max, Min } from 'class-validator';

export class CreateBetDto {
  @IsOptional()
  @IsArray()
  @ArrayMinSize(10)
  @ArrayMaxSize(10)
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(60, { each: true })
  numbers?: number[];

  @IsOptional()
  @IsBoolean()
  isSurprise?: boolean;
}
