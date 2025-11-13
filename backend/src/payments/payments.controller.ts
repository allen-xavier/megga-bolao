import { Body, Controller, ForbiddenException, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../users/decorators/current-user.decorator';
import { UserProfile, UserRole } from '../users/entities/user.entity';
import { RequestDepositDto } from './dto/request-deposit.dto';
import { RequestWithdrawDto } from './dto/request-withdraw.dto';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('me')
  listMine(@CurrentUser() user: UserProfile) {
    return this.paymentsService.listUserPayments(user.id);
  }

  @Post('deposit')
  requestDeposit(@Body() dto: RequestDepositDto, @CurrentUser() user: UserProfile) {
    return this.paymentsService.requestDeposit(user.id, dto);
  }

  @Post('withdraw')
  requestWithdraw(@Body() dto: RequestWithdrawDto, @CurrentUser() user: UserProfile) {
    return this.paymentsService.requestWithdraw(user.id, dto);
  }

  @Patch(':id/confirm')
  confirm(@Param('id') id: string, @CurrentUser() user: UserProfile) {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Apenas administradores podem confirmar pagamentos');
    }
    return this.paymentsService.confirmDeposit(id);
  }
}
