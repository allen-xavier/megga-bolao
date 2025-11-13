import { Module } from '@nestjs/common';
import { BetsController } from './bets.controller';
import { BetsService } from './bets.service';
import { TransparencyModule } from '../transparency/transparency.module';

@Module({
  imports: [TransparencyModule],
  controllers: [BetsController],
  providers: [BetsService],
})
export class BetsModule {}
