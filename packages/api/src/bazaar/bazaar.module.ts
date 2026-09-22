import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ScheduleModule } from '@nestjs/schedule';
import { BazaarService } from './bazaar.service';
import { BiddingGateway } from './bidding.gateway';
import { BiddingCloseScheduler } from './bidding-close.scheduler';
import { BazaarController } from './bazaar.controller';

@Module({
  imports: [
    PrismaModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [BazaarController],
  providers: [BazaarService, BiddingGateway, BiddingCloseScheduler],
})
export class BazaarModule {}

