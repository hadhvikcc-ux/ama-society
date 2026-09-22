import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { EventsVotingScheduler } from './events-voting.scheduler';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, ScheduleModule.forRoot()],
  controllers: [EventsController],
  providers: [EventsService, EventsVotingScheduler],
  exports: [EventsService],
})
export class EventsModule {}
