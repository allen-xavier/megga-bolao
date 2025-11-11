import { Module } from '@nestjs/common';
import { BoloesService } from './boloes.service';
import { BoloesController } from './boloes.controller';

@Module({
  controllers: [BoloesController],
  providers: [BoloesService],
})
export class BoloesModule {}
