import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { SuitpayWebhookController } from './suitpay-webhook.controller';
import { WalletModule } from '../wallet/wallet.module';
import { SuitpayConfigService } from './suitpay-config.service';
import { SuitpayClientService } from './suitpay-client.service';

@Module({
  imports: [WalletModule, HttpModule],
  controllers: [PaymentsController, SuitpayWebhookController],
  providers: [PaymentsService, SuitpayConfigService, SuitpayClientService],
})
export class PaymentsModule {}
