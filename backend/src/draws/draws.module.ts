import { Module } from '@nestjs/common';
import { DrawsController } from './draws.controller';
import { DrawsService } from './draws.service';
import { RankingsModule } from '../rankings/rankings.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [RankingsModule, EventsModule],
  controllers: [DrawsController],
  providers: [DrawsService],
})
export class DrawsModule {}
