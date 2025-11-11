import { Module } from '@nestjs/common';
import { DrawsController } from './draws.controller';
import { DrawsService } from './draws.service';
import { RankingsModule } from '../rankings/rankings.module';

@Module({
  imports: [RankingsModule],
  controllers: [DrawsController],
  providers: [DrawsService],
})
export class DrawsModule {}
