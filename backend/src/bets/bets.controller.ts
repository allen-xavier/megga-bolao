import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { BetsService } from './bets.service';
import { CreateBetDto } from './dto/create-bet.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../users/decorators/current-user.decorator';
import { UserProfile } from '../users/entities/user.entity';

@Controller('boloes/:bolaoId/bets')
export class BetsController {
  constructor(private readonly betsService: BetsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Param('bolaoId') bolaoId: string,
    @Body() dto: CreateBetDto,
    @CurrentUser() user: UserProfile,
  ) {
    return this.betsService.create(bolaoId, user.id, dto);
  }
}
