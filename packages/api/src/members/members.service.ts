import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MEMBER_ROLES, MemberRoleKey } from './member-roles';

const MEMBER_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  tenancyType: true,
  committeePosition: true,
  avatarUrl: true,
  flat: { select: { flatNumber: true, tower: true } },
} as const;

const REQUEST_INCLUDE = {
  user: { select: { id: true, name: true, phone: true } },
  requestedBy: { select: { id: true, name: true } },
  decidedBy: { select: { id: true, name: true } },
} as const;

type Actor = { id: string; role: string; committeePosition: string | null; societyId: string };

/**
 * Member roles with a two-person check: admins propose a change, the society President
 * approves it. A change the President proposes applies at once (they are the approver).
 */
@Injectable()
export class MembersService {
  constructor(private readonly prisma: PrismaService) {}

  /** Reads the caller from the database (never trusts the role in the token) and checks the society. */
  private async actor(actorId: string, societyId: string | undefined): Promise<Actor> {
    if (!societyId) throw new ForbiddenException('Your account is not linked to a society');
    const actor = await this.prisma.user.findFirst({
      where: { id: actorId, societyId, isActive: true, approvalStatus: 'APPROVED' },
      select: { id: true, role: true, committeePosition: true, societyId: true },
    });
    if (!actor) throw new ForbiddenException('Your account cannot manage members');
    return actor;
  }

  private isPresident(actor: Actor) {
    return actor.committeePosition === 'PRESIDENT' && (actor.role === 'ADMIN' || actor.role === 'COMMITTEE');
  }

  private assertCanManage(actor: Actor) {
    if (actor.role !== 'ADMIN' && !this.isPresident(actor)) {
      throw new ForbiddenException('Only admins and the President can manage member roles');
    }
  }

  async listMembers(actorId: string, societyId: string) {
    const actor = await this.actor(actorId, societyId);
    this.assertCanManage(actor);
    const [members, pending, recent] = await Promise.all([
      this.prisma.user.findMany({
        where: { societyId, approvalStatus: 'APPROVED', isActive: true },
        select: MEMBER_SELECT,
        orderBy: { name: 'asc' },
      }),
      this.prisma.roleChangeRequest.findMany({
        where: { societyId, status: 'PENDING' },
        include: REQUEST_INCLUDE,
        orderBy: { createdAt: 'asc' },
      }),
      // The last few approved / rejected changes, so admins can see what happened.
      this.prisma.roleChangeRequest.findMany({
        where: { societyId, status: { in: ['APPROVED', 'REJECTED'] } },
        include: REQUEST_INCLUDE,
        orderBy: { decidedAt: 'desc' },
        take: 5,
      }),
    ]);
    return {
      members,
      pendingRequests: pending,
      recentDecisions: recent,
      viewer: { id: actor.id, isPresident: this.isPresident(actor) },
    };
  }

  async requestRoleChange(actorId: string, societyId: string, userId: string, roleKey: MemberRoleKey, reason?: string) {
    const actor = await this.actor(actorId, societyId);
    this.assertCanManage(actor);
    const next = MEMBER_ROLES[roleKey];
    if (!next) throw new BadRequestException('Unknown role');

    const member = await this.prisma.user.findFirst({
      where: { id: userId, societyId, approvalStatus: 'APPROVED', isActive: true },
      select: { id: true, name: true, role: true, tenancyType: true, committeePosition: true },
    });
    if (!member) throw new NotFoundException('Member not found in your society');
    if (member.id === actor.id) throw new BadRequestException("You can't change your own role");
    if (member.committeePosition === 'PRESIDENT') {
      throw new BadRequestException("The President's role can't be changed here");
    }
    if (member.role === next.role && (member.tenancyType ?? null) === next.tenancyType) {
      throw new BadRequestException(`${member.name} already has this role`);
    }
    const open = await this.prisma.roleChangeRequest.findFirst({ where: { userId, status: 'PENDING' } });
    if (open) throw new ConflictException(`${member.name} already has a role change waiting for the President`);

    const data = {
      societyId,
      userId,
      fromRole: member.role,
      fromTenancy: member.tenancyType,
      toRole: next.role,
      toTenancy: next.tenancyType,
      reason: reason?.trim() || null,
      requestedById: actor.id,
    } as const;

    if (!this.isPresident(actor)) {
      const request = await this.prisma.roleChangeRequest.create({ data, include: REQUEST_INCLUDE });
      return { applied: false, request };
    }

    // The President is the approver: record the request as approved and apply it together.
    const [request] = await this.prisma.$transaction([
      this.prisma.roleChangeRequest.create({
        data: { ...data, status: 'APPROVED', decidedById: actor.id, decidedAt: new Date() },
        include: REQUEST_INCLUDE,
      }),
      this.prisma.user.update({ where: { id: userId }, data: { role: next.role, tenancyType: next.tenancyType } }),
    ]);
    return { applied: true, request };
  }

  async decide(actorId: string, societyId: string, requestId: string, approve: boolean) {
    const actor = await this.actor(actorId, societyId);
    if (!this.isPresident(actor)) throw new ForbiddenException('Only the President can approve or reject role changes');

    const request = await this.prisma.roleChangeRequest.findFirst({
      where: { id: requestId, societyId, status: 'PENDING' },
      include: { user: { select: { role: true, tenancyType: true } } },
    });
    if (!request) throw new NotFoundException('No pending role change with that id in your society');

    const decided = { status: approve ? 'APPROVED' : 'REJECTED', decidedById: actor.id, decidedAt: new Date() } as const;
    if (!approve) {
      return this.prisma.roleChangeRequest.update({ where: { id: requestId }, data: decided, include: REQUEST_INCLUDE });
    }

    // The member's role changed since the request was made: approving would overwrite it.
    if (request.user.role !== request.fromRole || (request.user.tenancyType ?? null) !== (request.fromTenancy ?? null)) {
      throw new ConflictException("This member's role has changed since the request was made. Please reject it and ask again.");
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.roleChangeRequest.update({ where: { id: requestId }, data: decided, include: REQUEST_INCLUDE }),
      this.prisma.user.update({ where: { id: request.userId }, data: { role: request.toRole, tenancyType: request.toTenancy } }),
    ]);
    return updated;
  }
}
