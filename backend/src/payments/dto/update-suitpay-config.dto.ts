import { IsIn, IsOptional, IsString, IsUrl } from "class-validator";

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
}
