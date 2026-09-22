import { IsArray, IsDateString, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { TicketCategory, TicketPriority, TicketStatus, FacilityPricingTier } from '@prisma/client';

export class CreateTicketDto {
  @IsUUID() flatId: string;
  @IsEnum(TicketCategory) category: TicketCategory;
  @IsEnum(TicketPriority) priority: TicketPriority;
  @IsString() @IsNotEmpty() description: string;
  @IsOptional() @IsArray() @IsString({ each: true }) beforeMediaUrls?: string[];
}

export class UpdateTicketStatusDto {
  @IsEnum(TicketStatus) status: TicketStatus;
  @IsOptional() @IsUUID() assignedToId?: string;
}

export class CreateBookingDto {
  @IsUUID() facilityId: string;
  @IsString() eventName: string;
  @IsDateString() startTime: string;
  @IsDateString() endTime: string;
  @IsInt() @Min(1) guestCount: number;
  @IsEnum(FacilityPricingTier) pricingTier: FacilityPricingTier;
}
