import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { InjectRedis } from '@liaoliaots/nestjs-redis';
import Redis from 'ioredis';
import * as bcrypt from 'bcrypt';
import axios from 'axios';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  async register(dto: RegisterDto) {
    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const society = await this.prisma.society.findFirst({
      where: {
        OR: [
          { id: dto.societyCode },
          { name: { startsWith: dto.societyCode } },
        ],
      },
    });

    if (!society) {
      throw new NotFoundException('Society not found');
    }

    let prismaRole = dto.role as any;
    if (dto.role === 'RESIDENT_OWNER' || dto.role === 'RESIDENT_TENANT') {
      prismaRole = 'RESIDENT';
    }

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        passwordHash: hashedPassword,
        role: prismaRole,
        societyId: society.id,
      },
    });

    const { passwordHash: _, ...safeUser } = user;
    const tokens = await this.generateTokens(user.id, user.role, user.email ?? '', user.societyId);
    return { user: safeUser, ...tokens };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { flat: true },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { passwordHash: _, ...safeUser } = user;
    const tokens = await this.generateTokens(user.id, user.role, user.email ?? '', user.societyId);
    return { user: safeUser, ...tokens };
  }

  async generateTokens(userId: string, role: string, email: string, societyId?: string) {
    const accessToken = this.jwtService.sign(
      { sub: userId, role, email, societyId },
      { expiresIn: '15m', secret: this.configService.get<string>('JWT_SECRET') },
    );

    const refreshToken = this.jwtService.sign(
      { sub: userId, role, email, societyId },
      { expiresIn: '7d', secret: this.configService.get<string>('JWT_REFRESH_SECRET') },
    );

    await this.redis.set(`refresh:${userId}`, refreshToken, 'EX', 7 * 24 * 60 * 60);

    return { accessToken, refreshToken };
  }

  async sendOtp(phone: string) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await this.redis.set(`otp:${phone}`, code, 'EX', 300);

    const authkey = this.configService.get<string>('MSG91_AUTH_KEY');
    const template_id = this.configService.get<string>('MSG91_TEMPLATE_ID');
    
    if (authkey && template_id) {
      try {
        await axios.post('https://api.msg91.com/api/v5/otp', null, {
          params: {
            template_id,
            mobile: `91${phone.replace('+91', '').trim()}`,
            authkey,
            otp: code,
          },
        });
      } catch (error) {
        console.error('Failed to send OTP via MSG91', error);
      }
    } else {
      console.log(`Development OTP for ${phone}: ${code}`);
    }

    return true;
  }

  async verifyOtp(phone: string, code: string) {
    const storedCode = await this.redis.get(`otp:${phone}`);
    if (!storedCode || storedCode !== code) {
      throw new BadRequestException('Invalid or expired OTP');
    }
    
    await this.redis.del(`otp:${phone}`);
    return true;
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const storedToken = await this.redis.get(`refresh:${payload.sub}`);
      if (!storedToken || storedToken !== refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return this.generateTokens(user.id, user.role, user.email ?? '', user.societyId);

    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        society: true,
        ownedFlat: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Omit passwordHash from response
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }
}
