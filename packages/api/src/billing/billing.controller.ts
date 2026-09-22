import { Controller, Post, Get, Body, Param, Query, UseGuards } from '@nestjs/common';
import { BillingService } from './billing.service';
import { CreateChargeTemplateDto, CreateExpenseDto, PaymentWebhookDto } from './dto/billing.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('billing')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('templates')
  @Roles('ADMIN')
  async createTemplate(@Body() dto: CreateChargeTemplateDto, @Body('societyId') societyId: string) {
    return this.billingService.createChargeTemplate(dto, societyId);
  }

  @Get('invoices')
  @Roles('RESIDENT', 'ADMIN')
  async getInvoices(
    @CurrentUser() user: any,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    return this.billingService.getInvoices(user.id, +page || 1, +limit || 10);
  }

  @Post('invoices/generate')
  @Roles('ADMIN')
  async generateInvoices(@Body('societyId') societyId: string) {
    const count = await this.billingService.generateInvoices(societyId);
    return { success: true, count };
  }

  @Post('pay/:invoiceId')
  @Roles('RESIDENT')
  async payInvoice(@Param('invoiceId') invoiceId: string, @CurrentUser() user: any) {
    return this.billingService.createRazorpayOrder(invoiceId, user.id);
  }

  @Post('webhook/razorpay')
  async razorpayWebhook(@Body() dto: PaymentWebhookDto) {
    return this.billingService.handlePaymentWebhook(dto);
  }

  @Get('ledger')
  @Roles('ADMIN')
  async getLedger(
    @Query('societyId') societyId: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    return this.billingService.getLedger(societyId, +page || 1, +limit || 10);
  }

  @Post('expenses')
  @Roles('ADMIN')
  async createExpense(@Body() dto: CreateExpenseDto) {
    return this.billingService.createExpenseEntry(dto);
  }
}
