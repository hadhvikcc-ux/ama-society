import { Controller, Post, Get, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { FacilityService } from './facilities.service';
import { CreateTicketDto, UpdateTicketStatusDto, CreateBookingDto } from './dto/tickets.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class TicketsController {
  constructor(
    private readonly ticketsService: TicketsService,
    private readonly facilityService: FacilityService
  ) {}

  @Post('tickets')
  @Roles('RESIDENT')
  async createTicket(@Body() dto: CreateTicketDto, @CurrentUser() user: any) {
    return this.ticketsService.createTicket(dto, user.id);
  }

  @Get('tickets')
  @Roles('RESIDENT', 'ADMIN', 'GUARD')
  async getTickets(@Query() filters: any, @CurrentUser() user: any) {
    if (user.role === 'RESIDENT') {
      filters.residentId = user.id;
    }
    return this.ticketsService.getTickets(filters);
  }

  @Get('tickets/:id')
  async getTicketById(@Param('id') id: string) {
    return this.ticketsService.getTicketById(id);
  }

  @Patch('tickets/:id/status')
  @Roles('ADMIN', 'GUARD')
  async updateTicketStatus(
    @Param('id') id: string, 
    @Body() dto: UpdateTicketStatusDto, 
    @CurrentUser() user: any
  ) {
    return this.ticketsService.updateStatus(id, dto, user.id, user.role);
  }

  @Post('tickets/:id/proof')
  async uploadAfterProof(
    @Param('id') id: string, 
    @Body('mediaUrls') mediaUrls: string[],
    @CurrentUser() user: any
  ) {
    return this.ticketsService.uploadAfterProof(id, mediaUrls, user.id);
  }

  @Post('tickets/:id/signoff/request')
  @Roles('ADMIN')
  async requestSignoff(@Param('id') id: string) {
    return this.ticketsService.generateSignoffToken(id);
  }

  @Post('tickets/:id/signoff')
  @Roles('RESIDENT')
  async signoffTicket(
    @Param('id') id: string, 
    @Body('code') code: string,
    @CurrentUser() user: any
  ) {
    return this.ticketsService.residentSignoff(id, code, user.id);
  }

  @Get('facilities')
  async getFacilities(@Query('societyId') societyId: string) {
    return this.facilityService.getFacilities(societyId);
  }

  @Post('facilities/book')
  @Roles('RESIDENT')
  async bookFacility(
    @Body() dto: CreateBookingDto, 
    @Body('societyId') societyId: string,
    @CurrentUser() user: any
  ) {
    return this.facilityService.createBooking(dto, user.id, societyId);
  }

  @Get('facilities/:id/availability')
  async checkAvailability(
    @Param('id') id: string,
    @Query('month') month: string,
    @Query('year') year: string
  ) {
    return this.facilityService.getBookingsByFacility(id, parseInt(month), parseInt(year));
  }
}
