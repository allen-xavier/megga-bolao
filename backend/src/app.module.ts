import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { BoloesModule } from './boloes/boloes.module';
import { DrawsModule } from './draws/draws.module';
import { PaymentsModule } from './payments/payments.module';
import { RankingsModule } from './rankings/rankings.module';
import { WalletModule } from './wallet/wallet.module';
import { NotificationsModule } from './notifications/notifications.module';
import { BetsModule } from './bets/bets.module';
import { TransparencyModule } from './transparency/transparency.module';
import { EventsModule } from './events/events.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    BoloesModule,
    DrawsModule,
    PaymentsModule,
    RankingsModule,
    WalletModule,
    NotificationsModule,
    BetsModule,
    TransparencyModule,
    EventsModule,
  ],
})
export class AppModule {}
