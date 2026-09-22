import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  async getTagTimeline(tag: string, societyId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const indexes = await this.prisma.tagIndex.findMany({
      where: { tag, societyId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    const timeline = await Promise.all(
      indexes.map(async (idx) => {
        let details = null;
        if (idx.entityType === 'CHAT') {
          details = await this.prisma.chatMessage.findUnique({ where: { id: idx.entityId }, include: { sender: true } });
        } else if (idx.entityType === 'TICKET') {
          details = await this.prisma.serviceTicket.findUnique({ where: { id: idx.entityId } });
        } else if (idx.entityType === 'EVENT') {
          details = await this.prisma.eventPool.findUnique({ where: { id: idx.entityId } });
        } else if (idx.entityType === 'INVOICE') {
          details = await this.prisma.invoice.findUnique({ where: { id: idx.entityId } });
        }

        return {
          id: idx.id,
          tag: idx.tag,
          entityType: idx.entityType,
          createdAt: idx.createdAt,
          details,
        };
      }),
    );

    return timeline;
  }

  async getTagAnalytics(societyId: string, startDate: Date, endDate: Date) {
    const group = await this.prisma.tagIndex.groupBy({
      by: ['tag'],
      where: {
        societyId,
        createdAt: { gte: startDate, lte: endDate },
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 50,
    });

    return group.map(g => ({ tag: g.tag, count: g._count.id }));
  }

  async getVendorFailureReport(societyId: string) {
    const tickets = await this.prisma.serviceTicket.findMany({
      where: {
        societyId,
        status: 'CLOSED',
        residentSignedOffAt: { not: null },
      },
    });

    const report: Record<string, { totalTime: number; count: number }> = {};

    for (const ticket of tickets) {
      const idxs = await this.prisma.tagIndex.findMany({
        where: { entityType: 'TICKET', entityId: ticket.id },
      });
      const resTime = ticket.residentSignedOffAt!.getTime() - ticket.createdAt.getTime();
      for (const idx of idxs) {
        if (!report[idx.tag]) report[idx.tag] = { totalTime: 0, count: 0 };
        report[idx.tag].totalTime += resTime;
        report[idx.tag].count += 1;
      }
    }

    return Object.entries(report).map(([tag, data]) => ({
      tag,
      avgResolutionTimeMs: data.totalTime / data.count,
      count: data.count,
    }));
  }

  async getPopularTags(societyId: string, limit: number = 20) {
    const group = await this.prisma.tagIndex.groupBy({
      by: ['tag'],
      where: { societyId },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: limit,
    });

    return group.map(g => ({ tag: g.tag, count: g._count.id }));
  }
}
