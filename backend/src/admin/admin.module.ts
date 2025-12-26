import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { AdminController } from "./admin.controller";
import { SuitpayAdminController } from "./suitpay.controller";
import { AffiliateConfigController } from "./affiliate-config.controller";
import { GeneralConfigController } from "./general-config.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { SuitpayConfigService } from "../payments/suitpay-config.service";
import { SuitpayClientService } from "../payments/suitpay-client.service";

@Module({
  imports: [PrismaModule, HttpModule],
  controllers: [AdminController, SuitpayAdminController, AffiliateConfigController, GeneralConfigController],
  providers: [SuitpayConfigService, SuitpayClientService],
})
export class AdminModule {}
