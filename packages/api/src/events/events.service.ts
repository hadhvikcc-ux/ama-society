import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.module';
import { CreatePoolDto, JoinPoolDto, UploadBudgetDto, LogExpenseDto, SurplusResolutionDto } from './dto/events.dto';
import { SurplusResolution } from '@prisma/client';

const toNum = (val: any): number => Number(val?.toString() ?? '0');

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createPool(dto: CreatePoolDto, creatorId: string, societyId: string) {
    return this.prisma.eventPool.create({
      data: {
        title: dto.title,
        description: dto.description,
        eventDate: new Date(dto.eventDate),
        totalEstimatedBudget: dto.totalEstimatedBudget,
        approvalThreshold: dto.approvalThreshold,
        status: 'DRAFT',
        societyId,
        createdById: creatorId,
      },
    });
  }

  async joinPool(poolId: string, userId: string, dto: JoinPoolDto) {
    return this.prisma.poolParticipant.upsert({
      where: {
        poolId_userId: { poolId, userId },
      },
      update: {
        participantRole: dto.participantRole,
        sponsorAmount: dto.sponsorAmount || 0,
      },
      create: {
        poolId,
        userId,
        participantRole: dto.participantRole,
        sponsorAmount: dto.sponsorAmount || 0,
      },
    });
  }

  async uploadBudget(poolId: string, dto: UploadBudgetDto, adminId: string) {
    const votingEndsAt = new Date();
    votingEndsAt.setHours(votingEndsAt.getHours() + 48);

    await this.prisma.eventPool.update({
      where: { id: poolId },
      data: {
        status: 'VOTING',
        votingEndsAt,
      },
    });

    for (const item of dto.items) {
      await this.prisma.poolBudgetItem.create({
        data: {
          poolId,
          description: item.description,
          estimatedAmount: item.estimatedAmount,
        },
      });
    }

    this.logger.log(`Notified participants for pool ${poolId} about budget upload.`);
    return { success: true };
  }

  async castVote(poolId: string, userId: string, approved: boolean) {
    const pool = await this.prisma.eventPool.findUnique({ where: { id: poolId }, include: { participants: true } });
    if (!pool || pool.status !== 'VOTING') throw new Error('Invalid pool or not in voting state');

    await this.prisma.poolVote.upsert({
      where: { poolId_userId: { poolId, userId } },
      update: { approved },
      create: { poolId, userId, approved },
    });

    const totalVotersCount = await this.prisma.poolVote.count({ where: { poolId } });
    const approvalVotesCount = await this.prisma.poolVote.count({ where: { poolId, approved: true } });

    await this.prisma.eventPool.update({
      where: { id: poolId },
      data: {
        totalVotersCount,
        approvalVotesCount,
      },
    });

    const totalParticipants = pool.participants.length;
    if (totalParticipants > 0) {
      const approvalPercentage = (approvalVotesCount / totalParticipants) * 100;
      if (approvalPercentage >= pool.approvalThreshold) {
        await this.prisma.eventPool.update({
          where: { id: poolId },
          data: { status: 'LOCKED' },
        });
      }
    }

    return { success: true };
  }

  async getPool(poolId: string) {
    return this.prisma.eventPool.findUnique({
      where: { id: poolId },
      include: {
        participants: true,
        budgetItems: true,
        votes: true,
      },
    });
  }

  async logExpense(poolId: string, dto: LogExpenseDto, claimedById: string) {
    await this.prisma.poolBudgetItem.update({
      where: { id: dto.itemId },
      data: {
        actualAmount: dto.actualAmount,
        receiptUrl: dto.receiptUrl,
        claimedById,
      },
    });

    const items = await this.prisma.poolBudgetItem.findMany({ where: { poolId } });
    const totalActualExpenses = items.reduce((acc, item) => acc + toNum(item.actualAmount), 0);

    await this.prisma.eventPool.update({
      where: { id: poolId },
      data: { totalActualExpenses },
    });

    return { success: true };
  }

  async reconcilePool(poolId: string) {
    const pool = await this.prisma.eventPool.findUnique({
      where: { id: poolId },
      include: { participants: true, budgetItems: true },
    });

    if (!pool) throw new Error('Pool not found');

    const totalSponsorships = pool.participants
      .filter((p) => p.participantRole === 'CONTRIBUTOR')
      .reduce((acc, p) => acc + toNum(p.sponsorAmount), 0);

    const totalActualExpenses = toNum(pool.totalActualExpenses);
    const partners = pool.participants.filter((p) => p.participantRole === 'ORGANIZER');

    
    let netDeficit = totalActualExpenses - totalSponsorships;
    if (netDeficit < 0) netDeficit = 0;

    const shareAmount = partners.length > 0 ? netDeficit / partners.length : 0;

    for (const partner of partners) {
      await this.prisma.poolParticipant.update({
        where: { id: partner.id },
        data: { shareAmount },
      });
    }

    const partnerContributions = partners.length * shareAmount;
    const surplus = totalSponsorships + partnerContributions - totalActualExpenses;

    await this.prisma.eventPool.update({
      where: { id: poolId },
      data: {
        surplusAmount: surplus > 0 ? surplus : 0,
        status: 'COMPLETED',
      },
    });

    return { success: true };
  }

  async resolveSurplus(poolId: string, resolution: SurplusResolution) {
    await this.prisma.eventPool.update({
      where: { id: poolId },
      data: { surplusResolution: resolution },
    });

    if (resolution === 'ROLLOVER') {
      this.logger.log(`Surplus for pool ${poolId} rolled over to society funds.`);
    } else if (resolution === 'CASHBACK') {
      this.logger.log(`Surplus for pool ${poolId} distributed as cashback to partners (creating negative invoice adjustments).`);
      // Mock creating negative invoices
    } else if (resolution === 'COMMUNITY_POLL') {
      this.logger.log(`Created a new community poll for surplus of pool ${poolId}.`);
    }

    return { success: true };
  }

  async closeVotingWindow(poolId: string) {
    const pool = await this.prisma.eventPool.findUnique({ where: { id: poolId }, include: { participants: true } });
    if (!pool) return;

    const approvalPercentage = pool.participants.length > 0 
      ? ((pool.approvalVotesCount || 0) / pool.participants.length) * 100 
      : 0;

    if (approvalPercentage >= pool.approvalThreshold) {
      await this.prisma.eventPool.update({
        where: { id: poolId },
        data: { status: 'LOCKED' },
      });
    } else {
      await this.prisma.eventPool.update({
        where: { id: poolId },
        data: { status: 'DRAFT' }, // Back to draft if not approved
      });
    }
  }
}
