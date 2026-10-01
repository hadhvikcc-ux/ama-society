import { describe, it, expect, jest } from '@jest/globals';
import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { MembersService } from './members.service';

const ADMIN = { id: 'admin', role: 'ADMIN', committeePosition: 'SECRETARY', societyId: 's1' };
const PRESIDENT = { id: 'pres', role: 'ADMIN', committeePosition: 'PRESIDENT', societyId: 's1' };
const GUARD = { id: 'guard', role: 'GUARD', committeePosition: null, societyId: 's1' };
const MEMBER = { id: 'm1', name: 'Asha', role: 'RESIDENT', tenancyType: 'OWNER', committeePosition: null };

/** Fake Prisma: `users` answers user.findFirst by id; `requests` answers roleChangeRequest.findFirst. */
function setup(users: Record<string, any>, openRequest: any = null) {
  const prisma: any = {
    user: {
      findFirst: jest.fn(async ({ where }: any) => users[where.id] ?? null),
      findMany: jest.fn(async () => []),
      update: jest.fn(async ({ where, data }: any) => ({ id: where.id, ...data })),
    },
    roleChangeRequest: {
      findFirst: jest.fn(async () => openRequest),
      findMany: jest.fn(async () => []),
      create: jest.fn(async ({ data }: any) => ({ id: 'r1', ...data })),
      update: jest.fn(async ({ where, data }: any) => ({ id: where.id, ...data })),
    },
    $transaction: jest.fn(async (ops: any[]) => Promise.all(ops)),
  };
  return { service: new MembersService(prisma), prisma };
}

describe('role change requests', () => {
  it('an admin request waits for the President and leaves the role unchanged', async () => {
    const { service, prisma } = setup({ admin: ADMIN, m1: MEMBER });
    const res: any = await service.requestRoleChange('admin', 's1', 'm1', 'COMMITTEE', 'Elected treasurer');
    expect(res.applied).toBe(false);
    expect(prisma.roleChangeRequest.create.mock.calls[0][0].data).toMatchObject({
      fromRole: 'RESIDENT', fromTenancy: 'OWNER', toRole: 'COMMITTEE', toTenancy: null, requestedById: 'admin', reason: 'Elected treasurer',
    });
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('a change by the President applies at once', async () => {
    const { service, prisma } = setup({ pres: PRESIDENT, m1: MEMBER });
    const res: any = await service.requestRoleChange('pres', 's1', 'm1', 'RESIDENT_TENANT');
    expect(res.applied).toBe(true);
    expect(prisma.user.update.mock.calls[0][0]).toEqual({ where: { id: 'm1' }, data: { role: 'RESIDENT', tenancyType: 'TENANT' } });
    expect(prisma.roleChangeRequest.create.mock.calls[0][0].data).toMatchObject({ status: 'APPROVED', decidedById: 'pres' });
  });

  it('non-admins cannot propose', async () => {
    const { service } = setup({ guard: GUARD, m1: MEMBER });
    await expect(service.requestRoleChange('guard', 's1', 'm1', 'ADMIN')).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('blocks changing your own role, the President, a no-op, and a second open request', async () => {
    await expect(setup({ admin: ADMIN }).service.requestRoleChange('admin', 's1', 'admin', 'GUARD')).rejects.toBeInstanceOf(BadRequestException);
    await expect(setup({ admin: ADMIN, pres: PRESIDENT }).service.requestRoleChange('admin', 's1', 'pres', 'GUARD')).rejects.toBeInstanceOf(BadRequestException);
    await expect(setup({ admin: ADMIN, m1: MEMBER }).service.requestRoleChange('admin', 's1', 'm1', 'RESIDENT_OWNER')).rejects.toBeInstanceOf(BadRequestException);
    await expect(setup({ admin: ADMIN, m1: MEMBER }, { id: 'open' }).service.requestRoleChange('admin', 's1', 'm1', 'GUARD')).rejects.toBeInstanceOf(ConflictException);
  });

  it('refuses callers without a society', async () => {
    await expect(setup({ admin: ADMIN }).service.listMembers('admin', undefined as any)).rejects.toBeInstanceOf(ForbiddenException);
  });
});

describe('President decisions', () => {
  const pending = { id: 'r1', userId: 'm1', fromRole: 'RESIDENT', fromTenancy: 'OWNER', toRole: 'COMMITTEE', toTenancy: null, user: { role: 'RESIDENT', tenancyType: 'OWNER' } };

  it('approving applies the new role', async () => {
    const { service, prisma } = setup({ pres: PRESIDENT }, pending);
    await service.decide('pres', 's1', 'r1', true);
    expect(prisma.roleChangeRequest.findFirst.mock.calls[0][0].where).toEqual({ id: 'r1', societyId: 's1', status: 'PENDING' });
    expect(prisma.user.update.mock.calls[0][0]).toEqual({ where: { id: 'm1' }, data: { role: 'COMMITTEE', tenancyType: null } });
  });

  it('rejecting leaves the role alone', async () => {
    const { service, prisma } = setup({ pres: PRESIDENT }, pending);
    const res: any = await service.decide('pres', 's1', 'r1', false);
    expect(res.status).toBe('REJECTED');
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('only the President can decide', async () => {
    const { service } = setup({ admin: ADMIN }, pending);
    await expect(service.decide('admin', 's1', 'r1', true)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('will not approve a request that is out of date', async () => {
    const stale = { ...pending, user: { role: 'GUARD', tenancyType: null } };
    const { service, prisma } = setup({ pres: PRESIDENT }, stale);
    await expect(service.decide('pres', 's1', 'r1', true)).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});
