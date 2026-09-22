import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChannelDto } from './dto/chat.dto';
import { ChatChannel, ChatMessage } from '@prisma/client';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async getChannels(societyId: string, userRole: string) {
    const channels = await this.prisma.chatChannel.findMany({
      where: { societyId },
    });

    return channels.filter((channel: ChatChannel) => {
      if (channel.type === 'COMMITTEE') {
        return userRole === 'ADMIN' || userRole === 'COMMITTEE';
      }
      if (channel.type === 'SECURITY_ALERT') {
        return userRole === 'GUARD' || userRole === 'ADMIN';
      }
      return true;
    });
  }

  maskPhone(phone: string) {
    if (!phone || phone.length < 4) return phone;
    return phone.slice(0, -4).replace(/\d/g, '*') + phone.slice(-4);
  }

  async getMessages(channelId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const messages = await this.prisma.chatMessage.findMany({
      where: { channelId },
      skip,
      take: limit,
      include: { sender: true },
      orderBy: { createdAt: 'desc' },
    });

    return messages.map((m: any) => {
      if (m.sender?.phone) {
        m.sender.phone = this.maskPhone(m.sender.phone);
      }
      return m;
    });
  }

  async createChannel(dto: CreateChannelDto) {
    return this.prisma.chatChannel.create({
      data: {
        type: dto.type,
        name: dto.name,
        description: dto.description,
        isEncrypted: dto.isEncrypted ?? false,
        societyId: dto.societyId,
      },
    });
  }

  async saveMessage(channelId: string, senderId: string, content: string) {
    return this.prisma.chatMessage.create({
      data: {
        channelId,
        senderId,
        content,
      },
      include: { sender: true },
    });
  }

  extractHashtags(text: string): string[] {
    const regex = /#([\w]+)/g;
    const matches = text.match(regex);
    return matches ? matches.map(tag => tag.substring(1)) : [];
  }
}
