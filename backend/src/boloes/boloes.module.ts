import { Module } from '@nestjs/common';
import { BoloesService } from './boloes.service';
import { BoloesController } from './boloes.controller';
import { TransparencyModule } from '../transparency/transparency.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [TransparencyModule, EventsModule],
  controllers: [BoloesController],
  providers: [BoloesService],
})
export class BoloesModule {}
