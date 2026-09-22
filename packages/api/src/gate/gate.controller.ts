import { Controller, Post, Body, Get, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { GateService } from './gate.service';
import { ScanQrDto, SendOtpDto, VerifyOtpDto } from './dto/scan.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('gate')
@ApiTags('gate')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class GateController {
  constructor(private readonly gateService: GateService) {}

  @Post('scan')
  @Roles('GUARD')
  async scanQr(@Body() dto: ScanQrDto, @CurrentUser() user: any) {
    return this.gateService.scanQr(dto, user.id);
  }

  @Post('otp/send')
  @Roles('GUARD')
  async sendOtp(@Body() dto: SendOtpDto) {
    await this.gateService.sendOtp(dto.phone);
    return { success: true, message: 'OTP sent successfully' };
  }

  @Post('otp/verify')
  @Roles('GUARD')
  async verifyOtp(@Body() dto: VerifyOtpDto, @CurrentUser() user: any) {
    const session = await this.gateService.verifyOtp(dto, user.id);
    return { success: true, session };
  }

  @Get('visitors/active')
  @Roles('GUARD', 'ADMIN')
  async getActiveVisitors(@Query('societyId') societyId: string) {
    return this.gateService.getActiveVisitors(societyId);
  }

  @Patch('visitors/:id/checkout')
  @Roles('GUARD')
  async checkoutVisitor(@Param('id') sessionId: string, @CurrentUser() user: any) {
    await this.gateService.checkoutVisitor(sessionId, user.id);
    return { success: true, message: 'Visitor checked out' };
  }

  @Post('pass/issue')
  @Roles('RESIDENT', 'ADMIN', 'RESIDENT_OWNER', 'RESIDENT_TENANT')
  async issueGatePass(@Body('flatId') flatId: string, @CurrentUser() user: any) {
    return this.gateService.issueGatePass(user.id, flatId, user.societyId || 'default-society-id');
  }
}
