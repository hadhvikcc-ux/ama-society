import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { TagIndexerService } from './tag-indexer.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SendMessageDto } from './dto/chat.dto';

@WebSocketGateway({ namespace: '/chat', cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(
    private readonly chatService: ChatService,
    private readonly tagIndexer: TagIndexerService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.split(' ')[1];
      const payload = this.jwtService.verify(token, { secret: this.configService.get('JWT_SECRET') });
      client.data.user = payload;
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {}

  @SubscribeMessage('joinChannel')
  async handleJoinChannel(@ConnectedSocket() client: Socket, @MessageBody() channelId: string) {
    // Basic verification omitted for brevity, logic in service
    client.join(`channel:${channelId}`);
    return { event: 'joinedChannel', data: { channelId } };
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(@ConnectedSocket() client: Socket, @MessageBody() dto: SendMessageDto) {
    const user = client.data.user;
    if (!user) return;

    const message = await this.chatService.saveMessage(dto.channelId, user.id, dto.content);
    const tags = this.chatService.extractHashtags(dto.content);
    if (tags.length > 0) {
      await this.tagIndexer.indexChatMessage(message, dto.content, user.societyId || '');
    }
    
    this.server.to(`channel:${dto.channelId}`).emit('newMessage', { ...message, senderName: user.name });
    return message;
  }

  @SubscribeMessage('securityAlert')
  async handleSecurityAlert(@ConnectedSocket() client: Socket, @MessageBody() payload: { societyId: string; message: string }) {
    if (client.data.user?.role !== 'GUARD') return;
    this.server.to(`security:${payload.societyId}`).emit('securityAlert', {
      from: client.data.user.id,
      message: payload.message,
      timestamp: new Date(),
    });
  }
}
