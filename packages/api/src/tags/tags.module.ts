import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TagsService } from './tags.service';
import { TagsController } from './tags.controller';

@Module({
  imports: [PrismaModule],
  controllers: [TagsController],
  providers: [TagsService],
  exports: [TagsService],
})
export class TagsModule {}
