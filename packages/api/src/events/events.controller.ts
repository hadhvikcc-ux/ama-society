import { Controller, Post, Get, Body, Param, Query, UseGuards } from '@nestjs/common';
import { EventsService } from './events.service';
import { CreatePoolDto, JoinPoolDto, UploadBudgetDto, CastVoteDto, LogExpenseDto, SurplusResolutionDto } from './dto/events.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('events')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post('pool')
  @Roles('ADMIN')
  async createPool(@Body() dto: CreatePoolDto, @Body('societyId') societyId: string, @CurrentUser() user: any) {
    return this.eventsService.createPool(dto, user.id, societyId);
  }

  @Post('pool/:id/join')
  @Roles('RESIDENT')
  async joinPool(@Param('id') id: string, @Body() dto: JoinPoolDto, @CurrentUser() user: any) {
    return this.eventsService.joinPool(id, user.id, dto);
  }

  @Post('pool/:id/budget')
  @Roles('ADMIN')
  async uploadBudget(@Param('id') id: string, @Body() dto: UploadBudgetDto, @CurrentUser() user: any) {
    return this.eventsService.uploadBudget(id, dto, user.id);
  }

  @Post('pool/:id/vote')
  @Roles('RESIDENT')
  async castVote(@Param('id') id: string, @Body() dto: CastVoteDto, @CurrentUser() user: any) {
    return this.eventsService.castVote(id, user.id, dto.approved);
  }

  @Get('pool/:id')
  async getPool(@Param('id') id: string) {
    return this.eventsService.getPool(id);
  }

  @Get('pools')
  async getPools(@Query('societyId') societyId: string, @CurrentUser() user: any) {
    // Basic implementation for getPools
    return { societyId, user };
  }

  @Post('pool/:id/expense')
  @Roles('RESIDENT') // volunteer claim
  async logExpense(@Param('id') id: string, @Body() dto: LogExpenseDto, @CurrentUser() user: any) {
    return this.eventsService.logExpense(id, dto, user.id);
  }

  @Post('pool/:id/reconcile')
  @Roles('ADMIN')
  async reconcilePool(@Param('id') id: string) {
    return this.eventsService.reconcilePool(id);
  }

  @Post('pool/:id/surplus')
  @Roles('ADMIN')
  async resolveSurplus(@Param('id') id: string, @Body() dto: SurplusResolutionDto) {
    return this.eventsService.resolveSurplus(id, dto.resolution);
  }
}
