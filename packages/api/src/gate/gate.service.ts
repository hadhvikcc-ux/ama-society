import { Injectable, UnauthorizedException, NotFoundException, HttpException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRedis } from '@liaoliaots/nestjs-redis';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import { ScanQrDto, VerifyOtpDto } from './dto/scan.dto';
import { VisitPurpose, VisitCategory } from '@prisma/client';

@Injectable()
export class GateService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  async scanQr(dto: ScanQrDto, guardId: string) {
    try {
      const payload = this.jwtService.verify(dto.token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      const gatePassToken = await this.prisma.gatePassToken.findFirst({
        where: {
          token: dto.token,
          isActive: true,
          expiresAt: { gt: new Date() },
        },
      });

      if (!gatePassToken) {
        throw new UnauthorizedException('Invalid or expired gate pass');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: { society: true },
      });

      let flat = payload.flatId ? await this.prisma.flat.findUnique({ where: { id: payload.flatId } }) : null;
      if (!flat && user?.flatId) {
        flat = await this.prisma.flat.findUnique({ where: { id: user.flatId } });
      }
      if (!flat && user) {
        flat = await this.prisma.flat.findFirst({ where: { societyId: user.societyId } });
      }

      if (!user || !flat) {
        throw new NotFoundException('Resident or flat not found');
      }

      await this.prisma.visitorSession.create({
        data: {
          societyId: user.societyId,
          guardId,
          flatId: flat.id,
          visitorName: user.name,
          visitorPhone: user.phone,
          purpose: VisitPurpose.VISIT,
          category: VisitCategory.GUEST,
          isOtpVerified: true,
          entryTime: new Date(),
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48h
        },
      });

      return {
        granted: true,
        residentName: user.name,
        flatNumber: flat.flatNumber,
        tower: flat.tower,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid gate pass signature');
    }
  }

  async sendOtp(phone: string) {
    return this.authService.sendOtp(phone);
  }

  async verifyOtp(dto: VerifyOtpDto, guardId: string) {
    await this.authService.verifyOtp(dto.phone, dto.code);

    const guard = await this.prisma.user.findUnique({
      where: { id: guardId },
    });

    if (!guard) {
      throw new UnauthorizedException('Guard not found');
    }

    const session = await this.prisma.visitorSession.create({
      data: {
        societyId: guard.societyId,
        guardId,
        flatId: dto.flatId,
        visitorName: dto.visitorName,
        visitorPhone: dto.phone,
        purpose: dto.purpose as any,
        category: dto.category as any,
        plateNumber: dto.plateNumber,
        isOtpVerified: true,
        entryTime: new Date(),
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      },
    });

    return session;
  }

  async getActiveVisitors(societyId: string) {
    const visitors = await this.prisma.visitorSession.findMany({
      where: {
        societyId,
        createdAt: { gt: new Date(Date.now() - 48 * 60 * 60 * 1000) },
        exitTime: null,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        flat: true,
      }
    });

    return visitors.map(v => ({
      ...v,
      visitorPhone: v.visitorPhone ? `***${v.visitorPhone.slice(-4)}` : null,
    }));
  }

  async checkoutVisitor(sessionId: string, guardId: string) {
    return this.prisma.visitorSession.update({
      where: { id: sessionId },
      data: { exitTime: new Date() },
    });
  }

  async issueGatePass(userId: string, flatId?: string, societyId?: string) {
    let targetSocietyId = societyId;
    let targetFlatId = flatId;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { flat: true },
    });

    if (user) {
      if (!targetSocietyId || targetSocietyId === 'default-society-id') {
        targetSocietyId = user.societyId;
      }
      if (!targetFlatId) {
        targetFlatId = user.flatId || user.flat?.id;
      }
    }

    if (!targetSocietyId) {
      throw new NotFoundException('Society not found for user');
    }

    const nonce = uuidv4();

    const token = this.jwtService.sign(
      { sub: userId, flatId: targetFlatId, nonce, type: 'GATE_PASS' },
      { expiresIn: '30d', secret: this.configService.get<string>('JWT_SECRET') },
    );

    await this.prisma.gatePassToken.create({
      data: {
        userId,
        societyId: targetSocietyId,
        token,
        isActive: true,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    return { token };
  }

  async purgeExpiredVisitors() {
    return this.prisma.visitorSession.deleteMany({
      where: {
        createdAt: { lt: new Date(Date.now() - 48 * 60 * 60 * 1000) },
      },
    });
  }
}


