import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.module';
import { CreateBookingDto } from './dto/tickets.dto';
import { PaymentStatus } from '@prisma/client';

@Injectable()
export class FacilityService {
  constructor(private readonly prisma: PrismaService) {}

  async getFacilities(societyId: string) {
    return this.prisma.facility.findMany({
      where: {
        societyId,
        isActive: true,
      },
    });
  }

  async checkAvailability(facilityId: string, startTime: string, endTime: string) {
    const overlapping = await this.prisma.facilityBooking.findFirst({
      where: {
        facilityId,
        AND: [
          { startTime: { lt: new Date(endTime) } },
          { endTime: { gt: new Date(startTime) } }
        ]
      },
    });
    
    return !overlapping;
  }

  async createBooking(dto: CreateBookingDto, userId: string, societyId: string) {
    const start = new Date(dto.startTime);
    const end = new Date(dto.endTime);

    if (start.getTime() <= Date.now()) {
      throw new BadRequestException('Cannot book a facility slot in the past. Please choose an upcoming time.');
    }

    const isAvailable = await this.checkAvailability(dto.facilityId, dto.startTime, dto.endTime);
    if (!isAvailable) {
      throw new ConflictException('Facility is not available for the selected time');
    }

    const facility = await this.prisma.facility.findUnique({ where: { id: dto.facilityId } });
    if (!facility) throw new Error('Facility not found');
    const hourDiff = Math.abs(end.getTime() - start.getTime()) / 36e5;
    
    // In a real app, calculate totalAmount based on pricingTier and facility rate
    const ratePerHour = 1000; 
    const totalAmount = hourDiff * ratePerHour;

    const booking = await this.prisma.facilityBooking.create({
      data: {
        facilityId: dto.facilityId,
        bookedById: userId,
        societyId,
        startTime: start,
        endTime: end,
        eventName: dto.eventName,
        guestCount: dto.guestCount,
        pricingTier: dto.pricingTier,
        totalAmount,
        status: PaymentStatus.PENDING,
      },
    });


    // Mock Razorpay order
    const orderId = `order_fac_${Math.random().toString(36).substring(7)}`;
    
    return { booking, orderId };
  }

  async getBookingsByFacility(facilityId: string, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    return this.prisma.facilityBooking.findMany({
      where: {
        facilityId,
        startTime: { gte: startDate },
        endTime: { lte: endDate },
      },
    });
  }
}
