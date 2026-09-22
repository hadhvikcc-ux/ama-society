import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class GateScheduler {
  constructor(@InjectQueue('gate-purge') private gatePurgeQueue: Queue) {}

  @Cron(CronExpression.EVERY_30_MINUTES)
  async schedulePurge() {
    await this.gatePurgeQueue.add('purge', {});
  }
}
