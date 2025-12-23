import { BadRequestException, Body, Controller, ForbiddenException, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../users/decorators/current-user.decorator';
import { UserProfile, UserRole } from '../users/entities/user.entity';
import { RequestDepositDto } from './dto/request-deposit.dto';
import { RequestWithdrawDto } from './dto/request-withdraw.dto';
import { UpdateWithdrawDto } from './dto/update-withdraw.dto';

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

  @Get('admin/withdraws')
  listWithdraws(
    @CurrentUser() user: UserProfile,
    @Query('status') status?: string,
    @Query('userId') userId?: string,
    @Query('search') search?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Apenas administradores podem visualizar saques');
    }
    const normalizedStatus = status ? status.toUpperCase() : undefined;
    if (normalizedStatus && !Object.values(PaymentStatus).includes(normalizedStatus as PaymentStatus)) {
      throw new BadRequestException('Status invalido');
    }
    const filterUserId = userId?.trim();
    const fromDate = from ? new Date(from) : undefined;
    const toDate = to ? new Date(to) : undefined;
    const validFrom = fromDate && !Number.isNaN(fromDate.getTime()) ? fromDate : undefined;
    const validTo = toDate && !Number.isNaN(toDate.getTime()) ? toDate : undefined;
    if (validFrom) {
      validFrom.setHours(0, 0, 0, 0);
    }
    if (validTo) {
      validTo.setHours(23, 59, 59, 999);
    }
    return this.paymentsService.listWithdraws(
      normalizedStatus as PaymentStatus | undefined,
      filterUserId && filterUserId.length > 0 ? filterUserId : undefined,
      search,
      validFrom,
      validTo,
    );
  }

  @Patch(':id/withdraw/complete')
  completeWithdraw(@Param('id') id: string, @CurrentUser() user: UserProfile) {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Apenas administradores podem processar saques');
    }
    return this.paymentsService.completeWithdraw(id);
  }

  @Patch(':id/withdraw/fail')
  failWithdraw(@Param('id') id: string, @Body() dto: UpdateWithdrawDto, @CurrentUser() user: UserProfile) {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Apenas administradores podem processar saques');
    }
    return this.paymentsService.failWithdraw(id, dto?.reason);
  }
}
