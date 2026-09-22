import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.module';
import { EventsService } from './events.service';

@Injectable()
export class EventsVotingScheduler {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService,
  ) {}

  @Cron('*/15 * * * *') // every 15 minutes
  async checkVotingWindows() {
    const expiredPools = await this.prisma.eventPool.findMany({
      where: {
        status: 'VOTING',
        votingEndsAt: { lt: new Date() },
      },
    });

    for (const pool of expiredPools) {
      await this.eventsService.closeVotingWindow(pool.id);
    }
  }
}
