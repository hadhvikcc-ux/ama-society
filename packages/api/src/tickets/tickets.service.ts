import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.module';
import { CreateTicketDto, UpdateTicketStatusDto } from './dto/tickets.dto';
import { TicketStatus } from '@prisma/client';

@Injectable()
export class TicketsService {
  constructor(private readonly prisma: PrismaService) {}

  async createTicket(dto: CreateTicketDto, userId: string) {
    // Get flat to determine societyId
    const flat = await this.prisma.flat.findUnique({ where: { id: dto.flatId } });
    if (!flat) throw new Error('Flat not found');

    const count = await this.prisma.serviceTicket.count({ where: { societyId: flat.societyId } });
    const ticketId = `AMA${String(count + 1).padStart(5, '0')}`;

    return this.prisma.serviceTicket.create({
      data: {
        id: ticketId,
        flatId: dto.flatId,
        raisedById: userId,
        societyId: flat.societyId,
        category: dto.category,
        priority: dto.priority,
        description: dto.description,
        beforeMediaUrls: dto.beforeMediaUrls || [],
      },
    });
  }


  async getTickets(filters: { societyId?: string; residentId?: string; status?: any; category?: any }) {
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.category) where.category = filters.category;
    if (filters.residentId) where.raisedById = filters.residentId;
    if (filters.societyId) {
      where.flat = { societyId: filters.societyId };
    }
    
    return this.prisma.serviceTicket.findMany({ where });
  }

  async getTicketById(id: string) {
    return this.prisma.serviceTicket.findUnique({
      where: { id },
      include: {
        raisedBy: true,
        assignedTo: true,
      },
    });
  }

  async updateStatus(ticketId: string, dto: UpdateTicketStatusDto, userId: string, role: string) {
    const ticket = await this.getTicketById(ticketId);
    if (!ticket) throw new Error('Ticket not found');
    
    if (dto.assignedToId && role !== 'ADMIN') {
      throw new ForbiddenException('Only ADMIN can assign tickets');
    }

    
    if ((dto.status === TicketStatus.IN_PROGRESS || dto.status === TicketStatus.PENDING_VERIFICATION) && role !== 'TECHNICIAN' && role !== 'ADMIN') {
       throw new ForbiddenException('Only TECHNICIAN or ADMIN can set this status');
    }

    const data: any = { status: dto.status };
    if (dto.assignedToId) data.assignedToId = dto.assignedToId;

    return this.prisma.serviceTicket.update({
      where: { id: ticketId },
      data,
    });
  }

  async uploadAfterProof(ticketId: string, mediaUrls: string[], technicianId: string) {
    return this.prisma.serviceTicket.update({
      where: { id: ticketId },
      data: {
        afterMediaUrls: mediaUrls,
        status: 'PENDING_VERIFICATION',
      },
    });
  }

  async generateSignoffToken(ticketId: string) {
    const token = Math.floor(100000 + Math.random() * 900000).toString();
    // In a real app, store in Redis with TTL 1h: `signoff:${ticketId}`
    // Mocking this behavior by storing it in the DB or returning it directly
    return { token, ttl: 3600 };
  }

  async residentSignoff(ticketId: string, code: string, residentId: string) {
    // Verify code from Redis. Mocking success if code is provided.
    if (!code) throw new Error('Invalid code');
    
    return this.prisma.serviceTicket.update({
      where: { id: ticketId },
      data: {
        status: 'CLOSED',
        residentSignedOffAt: new Date(),
      },
    });
  }
}
