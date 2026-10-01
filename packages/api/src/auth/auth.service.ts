import { Injectable, UnauthorizedException, BadRequestException, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { InjectRedis } from '@liaoliaots/nestjs-redis';
import Redis from 'ioredis';
import * as bcrypt from 'bcrypt';
import axios from 'axios';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { CompleteRegistrationDto } from './dto/firebase-auth.dto';
import { FirebaseAuthService } from './firebase-auth.service';
import { societyLookup } from '../common/society-code';
import { resolveSignupRole } from './signup-roles';

export const PENDING_APPROVAL_MESSAGE =
  'Your account is waiting for approval from your society admin. You can sign in once it is approved.';

/** Blocks sign-in for disabled accounts and staff sign-ups an admin has not approved. */
function assertCanSignIn(user: { isActive: boolean; approvalStatus?: string | null }) {
  if (!user.isActive) throw new UnauthorizedException('This account is disabled');
  if (user.approvalStatus === 'PENDING') throw new ForbiddenException(PENDING_APPROVAL_MESSAGE);
  if (user.approvalStatus === 'REJECTED') {
    throw new ForbiddenException('Your sign-up request was declined. Please contact your society office.');
  }
}

// What sign-in responses return alongside the user: their flat and their society's name and code.
const SESSION_USER_INCLUDE = { flat: true, society: { select: { code: true, name: true } } } as const;

interface RegistrationClaims {
  purpose: 'register';
  email?: string;
  phone?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly firebaseAuth: FirebaseAuthService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  // Separate key so a registration token can never pass as an access token.
  private registrationSecret() {
    return `${this.configService.get<string>('JWT_SECRET')}:registration`;
  }

  // Indian mobile numbers: accept "+91 98765 43210", "9876543210", etc.
  private normalizePhone(phone: string) {
    const national = phone.replace(/\D/g, '').slice(-10);
    return { e164: `+91${national}`, national };
  }

  /**
   * Google sign-in or phone OTP via Firebase Authentication. Existing users get tokens;
   * new users get a short-lived registration token to finish sign-up with completeRegistration.
   */
  async firebaseLogin(idToken: string) {
    const decoded = await this.firebaseAuth.verifyIdToken(idToken);
    const provider = decoded.firebase?.sign_in_provider;

    let claims: RegistrationClaims;
    if (provider === 'google.com') {
      if (!decoded.email || !decoded.email_verified) {
        throw new UnauthorizedException('Your Google account email is not verified');
      }
      claims = { purpose: 'register', email: decoded.email.toLowerCase() };
    } else if (provider === 'phone' && decoded.phone_number) {
      claims = { purpose: 'register', phone: this.normalizePhone(decoded.phone_number).e164 };
    } else {
      throw new UnauthorizedException('Unsupported sign-in method');
    }

    const where = claims.email
      ? { email: claims.email }
      : { OR: [{ phone: claims.phone! }, { phone: this.normalizePhone(claims.phone!).national }] };
    const user = await this.prisma.user.findFirst({ where, include: SESSION_USER_INCLUDE });

    if (user) {
      assertCanSignIn(user);
      const { passwordHash: _, ...safeUser } = user;
      const tokens = await this.generateTokens(user.id, user.role, user.email ?? '', user.societyId);
      return { user: safeUser, ...tokens };
    }

    const registrationToken = this.jwtService.sign(claims, { expiresIn: '15m', secret: this.registrationSecret() });
    return {
      needsRegistration: true,
      registrationToken,
      profile: { email: claims.email ?? null, phone: claims.phone ?? null, name: decoded.name ?? null },
    };
  }

  async completeRegistration(dto: CompleteRegistrationDto) {
    let claims: RegistrationClaims;
    try {
      claims = this.jwtService.verify(dto.registrationToken, { secret: this.registrationSecret() });
    } catch {
      throw new UnauthorizedException('Your sign-up session expired. Please sign in again.');
    }
    if (claims.purpose !== 'register') throw new UnauthorizedException('Invalid sign-up session');

    // A phone from Firebase is verified by OTP; Google sign-ups type theirs in.
    const rawPhone = claims.phone ?? dto.phone;
    if (!rawPhone) throw new BadRequestException('Mobile number is required');
    const { e164, national } = this.normalizePhone(rawPhone);

    const society = await this.prisma.society.findFirst({ where: societyLookup(dto.societyCode) });
    if (!society) throw new NotFoundException('Society code not found. Check the code (e.g. AMA-001) with your committee.');

    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ phone: e164 }, { phone: national }, ...(claims.email ? [{ email: claims.email }] : [])],
      },
    });
    if (existing) {
      throw new ConflictException('An account with this email or mobile number already exists. Please sign in instead.');
    }

    const signup = resolveSignupRole(dto.role);
    let user;
    try {
      user = await this.prisma.user.create({
        data: {
          name: dto.name.trim(),
          email: claims.email ?? null,
          phone: e164,
          role: signup.role,
          tenancyType: signup.tenancyType,
          approvalStatus: signup.needsApproval ? 'PENDING' : 'APPROVED',
          societyId: society.id,
        },
        include: SESSION_USER_INCLUDE,
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new ConflictException('An account with this email or mobile number already exists. Please sign in instead.');
      }
      throw error;
    }

    return this.signUpResponse(user);
  }

  /** Signed in at once, or (staff roles) no tokens until an admin approves the account. */
  private async signUpResponse(user: any) {
    const { passwordHash: _, ...safeUser } = user;
    if (user.approvalStatus === 'PENDING') {
      return { pendingApproval: true, message: PENDING_APPROVAL_MESSAGE, user: safeUser };
    }
    const tokens = await this.generateTokens(user.id, user.role, user.email ?? '', user.societyId);
    return { user: safeUser, ...tokens };
  }

  async register(dto: RegisterDto) {
    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const society = await this.prisma.society.findFirst({ where: societyLookup(dto.societyCode) });

    if (!society) {
      throw new NotFoundException('Society not found');
    }

    // RegisterDto never admits ADMIN; staff roles start PENDING until an admin approves them.
    const signup = resolveSignupRole(dto.role);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        passwordHash: hashedPassword,
        role: signup.role,
        tenancyType: signup.tenancyType,
        approvalStatus: signup.needsApproval ? 'PENDING' : 'APPROVED',
        societyId: society.id,
      },
      include: SESSION_USER_INCLUDE,
    });

    return this.signUpResponse(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: SESSION_USER_INCLUDE,
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    assertCanSignIn(user);

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

      if (!user || !user.isActive || user.approvalStatus !== 'APPROVED') {
        throw new UnauthorizedException('User not found');
      }

      return this.generateTokens(user.id, user.role, user.email ?? '', user.societyId);

    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async updateAvatar(userId: string, avatar: string | null) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: avatar },
      include: SESSION_USER_INCLUDE,
    });
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }

  /** Staff sign-ups waiting for approval in the admin's own society. */
  async listPendingApprovals(societyId: string) {
    // Without a society id the filters below would match every society.
    if (!societyId) throw new ForbiddenException('Your account is not linked to a society');
    return this.prisma.user.findMany({
      where: { societyId, approvalStatus: 'PENDING' },
      select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async decideApproval(societyId: string, userId: string, approve: boolean) {
    // Without a society id the filters below would match every society.
    if (!societyId) throw new ForbiddenException('Your account is not linked to a society');
    const user = await this.prisma.user.findFirst({ where: { id: userId, societyId, approvalStatus: 'PENDING' } });
    if (!user) throw new NotFoundException('No pending sign-up with that id in your society');
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { approvalStatus: approve ? 'APPROVED' : 'REJECTED' },
      select: { id: true, name: true, role: true, approvalStatus: true },
    });
    return updated;
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
