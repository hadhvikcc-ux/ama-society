import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { MembersService } from './members.service';
import { CreateRoleChangeDto } from './dto/role-change.dto';
import { MemberRoleKey } from './member-roles';

// Permissions (admin proposes, President approves) are checked in MembersService against the database.
@Controller('members')
@ApiTags('members')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MembersController {
  constructor(private readonly members: MembersService) {}

  @Get()
  list(@CurrentUser() user: any) {
    return this.members.listMembers(user.id, user.societyId);
  }

  @Post(':id/role-requests')
  requestRoleChange(@CurrentUser() user: any, @Param('id', ParseUUIDPipe) id: string, @Body() dto: CreateRoleChangeDto) {
    return this.members.requestRoleChange(user.id, user.societyId, id, dto.role as MemberRoleKey, dto.reason);
  }

  @Post('role-requests/:id/approve')
  @HttpCode(HttpStatus.OK)
  approve(@CurrentUser() user: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.members.decide(user.id, user.societyId, id, true);
  }

  @Post('role-requests/:id/reject')
  @HttpCode(HttpStatus.OK)
  reject(@CurrentUser() user: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.members.decide(user.id, user.societyId, id, false);
  }
}
