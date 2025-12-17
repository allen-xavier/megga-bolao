import { Module } from '@nestjs/common';
import { RankingsService } from './rankings.service';
import { RankingsController } from './rankings.controller';
import { WinnersController } from './winners.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [RankingsService, PrismaService],
  controllers: [RankingsController, WinnersController],
  exports: [RankingsService],
})
export class RankingsModule {}
