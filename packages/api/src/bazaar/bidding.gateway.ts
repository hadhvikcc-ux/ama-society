import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ namespace: '/bidding', cors: { origin: '*' } })
export class BiddingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  handleConnection(client: Socket) {
    console.log(`Bidding client connected: ${client.id}`);
  }
  handleDisconnect(client: Socket) {
    console.log(`Bidding client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinBidRoom')
  handleJoinBidRoom(@ConnectedSocket() client: Socket, @MessageBody() orderId: string) {
    client.join(`bid:${orderId}`);
    return { event: 'joinedBidRoom', data: { orderId } };
  }

  emitNewBid(orderId: string, bid: any) {
    this.server.to(`bid:${orderId}`).emit('newBid', bid);
  }

  emitBidWinner(orderId: string, winner: any) {
    this.server.to(`bid:${orderId}`).emit('bidWinner', winner);
  }
}
