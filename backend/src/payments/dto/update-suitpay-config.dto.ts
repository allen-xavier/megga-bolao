import { Type } from "class-transformer";
import { IsIn, IsNumber, IsOptional, IsString, IsUrl, Min } from "class-validator";

export class UpdateSuitpayConfigDto {
  @IsOptional()
  @IsIn(["sandbox", "production"])
  environment?: "sandbox" | "production";

  @IsOptional()
  @IsUrl({ require_tld: false })
  apiUrl?: string;

  @IsOptional()
  @IsString()
  clientId?: string;

  @IsOptional()
  @IsString()
  clientSecret?: string;

  @IsOptional()
  @IsString()
  webhookSecret?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  autoApprovalLimit?: number;
}
