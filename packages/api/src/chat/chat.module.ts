import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { TagIndexerService } from './tag-indexer.service';
import { ChatGateway } from './chat.gateway';
import { ChatController } from './chat.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    PrismaModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [ChatController],
  providers: [ChatService, TagIndexerService, ChatGateway],
  exports: [ChatService, TagIndexerService],
})
export class ChatModule {}
