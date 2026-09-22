import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.module';
import { CreateChargeTemplateDto, CreateExpenseDto, PaymentWebhookDto } from './dto/billing.dto';
import * as crypto from 'crypto';

const toNum = (val: any): number => Number(val?.toString() ?? '0');

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly prisma: PrismaService
  ) {}

  async createChargeTemplate(dto: CreateChargeTemplateDto, societyId: string) {
    const { societyId: _, ...data } = dto;
    return this.prisma.chargeTemplate.create({
      data: {
        ...data,
        societyId,
      },
    });
  }

  async generateInvoices(societyId: string) {
    const templates = await this.prisma.chargeTemplate.findMany({
      where: { societyId, isActive: true },
    });

    let count = 0;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    for (const template of templates) {
      const flats = await this.prisma.flat.findMany({
        where: { societyId, tenancyType: template.appliesTo },
      });

      for (const flat of flats) {
        const residentId = flat.ownerId || flat.tenantId;
        if (!residentId) continue;
        
        const invoice = await this.prisma.invoice.create({
          data: {
            societyId: template.societyId,
            amount: template.amount,
            dueDate,
            status: 'ISSUED',
            flatId: flat.id,
            residentId: residentId,
            templateId: template.id,
          },
        });

        await this.prisma.ledgerEntry.create({
          data: {
            societyId,
            entryType: 'DEBIT',
            category: 'MAINTENANCE',
            amount: template.amount,
            description: `Invoice for ${template.name}`,
            referenceId: invoice.id,
          },
        });

        count++;
      }
    }
    return count;
  }

  async getInvoices(residentId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where: { residentId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.invoice.count({ where: { residentId } }),
    ]);
    return { data, total, page, limit };
  }

  async createRazorpayOrder(invoiceId: string, userId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
    });
    
    if (!invoice) throw new Error('Invoice not found');
    if (invoice.residentId !== userId) throw new Error('Unauthorized');
    
    // Mock Razorpay Order Creation
    const orderId = `order_${Math.random().toString(36).substring(7)}`;
    
    await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: { razorpayOrderId: orderId },
    });
    
    return {
      orderId,
      amount: toNum(invoice.amount) * 100,
      currency: 'INR',
      receipt: invoiceId,
    };
  }

  async handlePaymentWebhook(body: PaymentWebhookDto) {
    const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'mock_secret';
    
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(`${body.razorpay_order_id}|${body.razorpay_payment_id}`)
      .digest('hex');
      
    // In real app, we verify signature. Mocking it here.
    const isValid = body.razorpay_signature === expectedSignature || true; 
    
    if (!isValid) throw new Error('Invalid signature');
    
    const invoice = await this.prisma.invoice.findFirst({
      where: { razorpayOrderId: body.razorpay_order_id },
      include: { flat: true }
    });
    
    if (!invoice) throw new Error('Invoice not found');
    
    const pdfBuffer = await this.generatePdfReceipt(invoice);
    const pdfUrl = `https://mock-s3.com/receipts/${invoice.id}.pdf`; // mock s3 upload
    
    await this.prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        razorpayPaymentId: body.razorpay_payment_id,
        pdfUrl,
      },
    });
    
    await this.prisma.ledgerEntry.create({
      data: {
        societyId: invoice.flat.societyId,
        entryType: 'CREDIT',
        category: 'PAYMENT',
        amount: invoice.amount,
        description: `Payment for Invoice ${invoice.id}`,
        referenceId: invoice.id,
      },
    });


    
    return { success: true };
  }

  async generatePdfReceipt(invoice: any): Promise<Buffer> {
    const html = `<html><body><h1>Receipt for Invoice ${invoice.id}</h1><p>Amount: ${invoice.amount}</p></body></html>`;
    return Buffer.from(html);
  }

  async getLedger(societyId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.ledgerEntry.findMany({
        where: { societyId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.ledgerEntry.count({ where: { societyId } }),
    ]);
    return { data, total, page, limit };
  }

  async createExpenseEntry(dto: CreateExpenseDto) {
    return this.prisma.ledgerEntry.create({
      data: {
        societyId: dto.societyId,
        entryType: 'DEBIT',
        amount: dto.amount,
        description: dto.description,
        category: dto.category,
        attachmentUrl: dto.attachmentUrl,
      },
    });
  }

  async sendOverdueReminders() {
    const now = new Date();
    const overdueInvoices = await this.prisma.invoice.findMany({
      where: {
        status: 'ISSUED',
        dueDate: { lt: now },
      },
    });
    
    for (const invoice of overdueInvoices) {
      this.logger.warn(`Reminder: Invoice ${invoice.id} for user ${invoice.residentId} is overdue!`);
    }
  }
}
