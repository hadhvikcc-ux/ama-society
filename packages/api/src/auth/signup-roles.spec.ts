import { describe, it, expect, jest } from '@jest/globals';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { resolveSignupRole } from './signup-roles';

const config = { get: (k: string) => ({ JWT_SECRET: 'test-secret', JWT_REFRESH_SECRET: 'test-refresh' } as any)[k] };
const registerBody = (role: string) => ({
  name: 'Asha', email: 'asha@example.com', phone: '+919876543210', password: 'password123', societyCode: 'AMA-001', role,
});

function setup(overrides: any = {}) {
  const prisma: any = {
    society: { findFirst: jest.fn(async () => ({ id: 's1' })) },
    user: {
      create: jest.fn(async ({ data }: any) => ({ id: 'u1', isActive: true, passwordHash: 'h', flat: null, ...data })),
      findUnique: jest.fn(async () => null),
      findFirst: jest.fn(async () => null),
      findMany: jest.fn(async () => []),
      update: jest.fn(async ({ data }: any) => ({ id: 'u2', name: 'Ravi', role: 'GUARD', ...data })),
      ...overrides,
    },
  };
  const redis: any = { set: jest.fn(async () => 'OK') };
  const service = new AuthService(prisma, new JwtService({}), config as any, {} as any, redis);
  return { service, prisma };
}

describe('sign-up role choice', () => {
  it('maps owner and tenant to RESIDENT with the tenancy, staff roles to pending', () => {
    expect(resolveSignupRole('RESIDENT_TENANT')).toEqual({ role: 'RESIDENT', tenancyType: 'TENANT', needsApproval: false });
    expect(resolveSignupRole('GUARD')).toMatchObject({ role: 'GUARD', needsApproval: true });
    expect(resolveSignupRole(undefined)).toMatchObject({ role: 'RESIDENT', tenancyType: 'OWNER' });
  });

  it('never lets anyone sign up as ADMIN', () => {
    expect(validateSync(plainToInstance(RegisterDto, registerBody('ADMIN')))).not.toHaveLength(0);
    expect(validateSync(plainToInstance(RegisterDto, registerBody('SUPPLIER')))).toHaveLength(0);
    expect(resolveSignupRole('ADMIN')).toMatchObject({ role: 'RESIDENT' });
  });

  it('signs residents in straight away', async () => {
    const { service, prisma } = setup();
    const res: any = await service.register(registerBody('RESIDENT_TENANT') as any);
    expect(prisma.user.create.mock.calls[0][0].data).toMatchObject({ role: 'RESIDENT', tenancyType: 'TENANT', approvalStatus: 'APPROVED' });
    expect(res.accessToken).toBeDefined();
    expect(res.user.passwordHash).toBeUndefined();
  });

  it('gives staff sign-ups no tokens until approved', async () => {
    const { service, prisma } = setup();
    const res: any = await service.register(registerBody('GUARD') as any);
    expect(prisma.user.create.mock.calls[0][0].data).toMatchObject({ role: 'GUARD', approvalStatus: 'PENDING' });
    expect(res.pendingApproval).toBe(true);
    expect(res.accessToken).toBeUndefined();
  });

  it('refuses password sign-in while pending', async () => {
    const passwordHash = await bcrypt.hash('password123', 4);
    const { service } = setup({
      findUnique: jest.fn(async () => ({ id: 'u2', isActive: true, approvalStatus: 'PENDING', passwordHash, role: 'GUARD' })),
    });
    await expect(service.login({ email: 'g@example.com', password: 'password123' } as any)).rejects.toBeInstanceOf(ForbiddenException);
  });
});

describe('admin approvals', () => {
  it('only touches pending sign-ups in the admin\'s own society', async () => {
    const { service, prisma } = setup({ findFirst: jest.fn(async () => ({ id: 'u2' })) });
    const res: any = await service.decideApproval('s1', 'u2', true);
    expect(prisma.user.findFirst.mock.calls[0][0].where).toEqual({ id: 'u2', societyId: 's1', approvalStatus: 'PENDING' });
    expect(res.approvalStatus).toBe('APPROVED');
  });

  it('reports a missing or other-society sign-up as not found', async () => {
    const { service } = setup();
    await expect(service.decideApproval('s1', 'u9', false)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('refuses when the admin has no society', async () => {
    const { service, prisma } = setup();
    await expect(service.listPendingApprovals(undefined as any)).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.user.findMany).not.toHaveBeenCalled();
  });
});
