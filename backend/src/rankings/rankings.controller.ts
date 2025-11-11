import { Controller, Get, Param, Query } from '@nestjs/common';
import { RankingsService } from './rankings.service';

@Controller('rankings')
export class RankingsController {
  constructor(private readonly rankingsService: RankingsService) {}

  @Get('global')
  global(@Query('limit') limit?: string) {
    return this.rankingsService.getGlobalRanking(limit ? parseInt(limit, 10) : undefined);
  }

  @Get('bolao/:id')
  byBolao(@Param('id') id: string, @Query('limit') limit?: string) {
    return this.rankingsService.getRankingForBolao(id, limit ? parseInt(limit, 10) : undefined);
  }
}
