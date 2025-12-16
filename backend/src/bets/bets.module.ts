import { Module } from '@nestjs/common';
import { BetsController } from './bets.controller';
import { BetsService } from './bets.service';
import { TransparencyModule } from '../transparency/transparency.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [TransparencyModule, EventsModule],
  controllers: [BetsController],
  providers: [BetsService],
})
export class BetsModule {}
