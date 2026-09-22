import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { GateService } from './gate.service';

@Processor('gate-purge')
export class GatePurgeProcessor {
  constructor(private readonly gateService: GateService) {}

  @Process('purge')
  async handlePurge(job: Job) {
    await this.gateService.purgeExpiredVisitors();
    return { purged: true, timestamp: new Date() };
  }
}
