import { Module } from '@nestjs/common';
import { BoloesService } from './boloes.service';
import { BoloesController } from './boloes.controller';
import { TransparencyModule } from '../transparency/transparency.module';

@Module({
  imports: [TransparencyModule],
  controllers: [BoloesController],
  providers: [BoloesService],
})
export class BoloesModule {}
