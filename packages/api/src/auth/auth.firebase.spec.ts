import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';

const config = { get: (k: string) => ({ JWT_SECRET: 'test-secret', JWT_REFRESH_SECRET: 'test-refresh' } as any)[k] };

function setup(decoded: any, existingUser: any = null) {
  const prisma: any = {
    user: {
      findFirst: jest.fn(async () => existingUser),
      create: jest.fn(async ({ data }: any) => ({ id: 'u1', passwordHash: null, isActive: true, flat: null, ...data })),
    },
    society: { findFirst: jest.fn(async () => ({ id: 's1', name: 'AMA Grand Estate' })) },
  };
  const firebase: any = { verifyIdToken: jest.fn(async () => decoded) };
  const redis: any = { set: jest.fn(async () => 'OK') };
  const jwt = new JwtService({});
  const service = new AuthService(prisma, jwt, config as any, firebase, redis);
  return { service, prisma, jwt };
}

describe('Firebase sign-in', () => {
  let google: any;
  let phone: any;
  beforeEach(() => {
    google = { firebase: { sign_in_provider: 'google.com' }, email: 'Asha@Gmail.com', email_verified: true, name: 'Asha' };
    phone = { firebase: { sign_in_provider: 'phone' }, phone_number: '+919876543210' };
  });

  it('logs in an existing user matched by verified Google email', async () => {
    const { service, prisma } = setup(google, { id: 'u9', email: 'asha@gmail.com', role: 'RESIDENT', societyId: 's1', isActive: true, passwordHash: 'x' });
    const res: any = await service.firebaseLogin('tok');
    expect(prisma.user.findFirst.mock.calls[0][0].where).toEqual({ email: 'asha@gmail.com' });
    expect(res.accessToken).toBeDefined();
    expect(res.user.passwordHash).toBeUndefined();
  });

  it('matches phone users stored with or without +91', async () => {
    const { service, prisma } = setup(phone, null);
    await service.firebaseLogin('tok');
    expect(prisma.user.findFirst.mock.calls[0][0].where).toEqual({ OR: [{ phone: '+919876543210' }, { phone: '9876543210' }] });
  });

  it('rejects an unverified Google email', async () => {
    const { service } = setup({ ...google, email_verified: false });
    await expect(service.firebaseLogin('tok')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('asks new Google users to register, then creates a RESIDENT with the typed phone', async () => {
    const { service, prisma } = setup(google, null);
    const first: any = await service.firebaseLogin('tok');
    expect(first.needsRegistration).toBe(true);
    expect(first.profile).toEqual({ email: 'asha@gmail.com', phone: null, name: 'Asha' });

    await expect(service.completeRegistration({ registrationToken: first.registrationToken, name: 'Asha', societyCode: 'ama-001' }))
      .rejects.toBeInstanceOf(BadRequestException);

    const done: any = await service.completeRegistration({ registrationToken: first.registrationToken, name: ' Asha ', phone: '98765 43210', societyCode: 'AMA-001' });
    expect(prisma.user.create.mock.calls[0][0].data).toEqual({ name: 'Asha', email: 'asha@gmail.com', phone: '+919876543210', role: 'RESIDENT', societyId: 's1' });
    expect(prisma.society.findFirst.mock.calls.at(-1)[0].where).toEqual({ OR: [{ code: 'AMA-001' }, { id: 'AMA-001' }] });
    expect(done.accessToken).toBeDefined();
  });

  it('uses the OTP-verified phone and ignores a typed one', async () => {
    const { service, prisma } = setup(phone, null);
    const first: any = await service.firebaseLogin('tok');
    await service.completeRegistration({ registrationToken: first.registrationToken, name: 'Ravi', phone: '9000000000', societyCode: 's1' });
    expect(prisma.user.create.mock.calls[0][0].data.phone).toBe('+919876543210');
  });

  it('refuses duplicate accounts', async () => {
    const { service, prisma } = setup(phone, null);
    const first: any = await service.firebaseLogin('tok');
    prisma.user.findFirst.mockResolvedValueOnce({ id: 'other' });
    await expect(service.completeRegistration({ registrationToken: first.registrationToken, name: 'Ravi', societyCode: 's1' }))
      .rejects.toBeInstanceOf(ConflictException);
  });

  it('does not accept an access token or forged token as a registration token', async () => {
    const { service, jwt } = setup(phone, null);
    const access = jwt.sign({ sub: 'u1', role: 'ADMIN' }, { secret: 'test-secret' });
    await expect(service.completeRegistration({ registrationToken: access, name: 'X', societyCode: 's1' }))
      .rejects.toBeInstanceOf(UnauthorizedException);
  });
});
