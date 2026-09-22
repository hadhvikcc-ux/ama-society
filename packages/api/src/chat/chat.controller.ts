import { Controller, Get, Post, Body, Param, Query, UseGuards, Req, ParseIntPipe } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateChannelDto } from './dto/chat.dto';

@Controller('chat')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('channels')
  async getChannels(@Query('societyId') societyId: string, @Req() req: any) {
    return this.chatService.getChannels(societyId, req.user.role);
  }

  @Get('channels/:id/messages')
  async getMessages(
    @Param('id') id: string,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 50,
  ) {
    return this.chatService.getMessages(id, page, limit);
  }

  @Post('channels')
  @Roles('ADMIN')
  async createChannel(@Body() dto: CreateChannelDto) {
    return this.chatService.createChannel(dto);
  }
}
