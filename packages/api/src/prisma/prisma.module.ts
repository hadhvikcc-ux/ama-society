import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// Re-export PrismaService so modules can import from either path
export { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
