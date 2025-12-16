import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AffiliatesController } from './affiliates.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, ConfigModule],
  providers: [UsersService],
  controllers: [UsersController, AffiliatesController],
  exports: [UsersService],
})
export class UsersModule {}
