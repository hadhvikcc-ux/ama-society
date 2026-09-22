import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { BillingService } from './billing.service';
import { PrismaService } from '../prisma/prisma.module';

@Injectable()
export class BillingCronService {
  constructor(
    private readonly billingService: BillingService, 
    private readonly prisma: PrismaService
  ) {}
  
  @Cron('0 0 * * *') // midnight daily
  async runDailyBillingCheck() {
    const societies = await this.prisma.society.findMany();
    for (const society of societies) {
      // Only generate if today is the 1st of the month
      const today = new Date();
      if (today.getDate() === 1) {
        await this.billingService.generateInvoices(society.id);
      }
    }
  }

  @Cron('0 9 * * *') // 9am daily
  async sendDailyReminders() {
    await this.billingService.sendOverdueReminders();
  }
}
