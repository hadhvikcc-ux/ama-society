import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChatService } from './chat.service';

@Injectable()
export class TagIndexerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chatService: ChatService,
  ) {}

  async indexEntity(tags: string[], entityType: string, entityId: string, societyId: string, flatId?: string) {
    for (const tag of tags) {
      // Upsert logic for simple indexing; you could just insert depending on schema
      await this.prisma.tagIndex.create({
        data: {
          tag,
          entityType,
          entityId,
          societyId,
          flatId,
        },
      });
    }
  }

  async indexChatMessage(message: any, content: string, societyId: string) {
    const tags = this.chatService.extractHashtags(content);
    if (tags.length > 0) {
      await this.indexEntity(tags, 'CHAT', message.id, societyId);
    }
  }

  async indexTicket(ticket: any) {
    const tags = this.chatService.extractHashtags(ticket.description || '');
    if (tags.length > 0) {
      await this.indexEntity(tags, 'TICKET', ticket.id, ticket.societyId, ticket.flatId);
    }
  }

  async indexEvent(pool: any) {
    const tags = this.chatService.extractHashtags((pool.title || '') + ' ' + (pool.description || ''));
    if (tags.length > 0) {
      await this.indexEntity(tags, 'EVENT', pool.id, pool.societyId);
    }
  }

  async indexInvoice(invoice: any, societyId: string) {
    const tags = ['Invoice', 'Billing'];
    await this.indexEntity(tags, 'INVOICE', invoice.id, societyId, invoice.flatId);
  }
}
