import { Body, Controller, Post } from "@nestjs/common";
import { PaymentsService } from "./payments.service";

@Controller("payments/webhooks/suitpay")
export class SuitpayWebhookController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post("cash-in")
  async cashIn(@Body() payload: Record<string, any>) {
    return this.paymentsService.handleSuitpayCashIn(payload);
  }

  @Post("cash-out")
  async cashOut(@Body() payload: Record<string, any>) {
    return this.paymentsService.handleSuitpayCashOut(payload);
  }
}
