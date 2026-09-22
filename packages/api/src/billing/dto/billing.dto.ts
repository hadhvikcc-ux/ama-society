import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { BillingCycle, TenancyType } from '@prisma/client';

export class CreateChargeTemplateDto {
  @IsString() name: string;
  @IsString() description: string;
  @IsNumber() @Min(0) amount: number;
  @IsEnum(BillingCycle) cycle: BillingCycle;
  @IsEnum(TenancyType) appliesTo: TenancyType;
  @IsOptional() @IsUUID() societyId?: string;
}

export class CreateExpenseDto {
  @IsString() category: string;
  @IsString() description: string;
  @IsNumber() @Min(0) amount: number;
  @IsOptional() @IsString() attachmentUrl?: string;
  @IsUUID() societyId: string;
}

export class PaymentWebhookDto {
  @IsString() razorpay_order_id: string;
  @IsString() razorpay_payment_id: string;
  @IsString() razorpay_signature: string;
}
