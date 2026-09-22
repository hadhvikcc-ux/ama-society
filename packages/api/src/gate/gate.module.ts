import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { GateService } from './gate.service';
import { GateController } from './gate.controller';
import { GatePurgeProcessor } from './gate-purge.processor';
import { GateScheduler } from './gate.scheduler';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    BullModule.registerQueue({ name: 'gate-purge' }),
    ScheduleModule.forRoot(),
  ],
  providers: [GateService, GatePurgeProcessor, GateScheduler],
  controllers: [GateController],
})
export class GateModule {}
