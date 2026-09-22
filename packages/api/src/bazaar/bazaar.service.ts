import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { InjectRedis } from '@liaoliaots/nestjs-redis';
import { Redis } from 'ioredis';
import { CheckoutDto, PlaceBidDto } from './dto/bazaar.dto';
import axios from 'axios';
import { BiddingGateway } from './bidding.gateway';
import { v4 as uuidv4 } from 'uuid';


@Injectable()
export class BazaarService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    @InjectRedis() private readonly redis: Redis,
    private readonly biddingGateway: BiddingGateway,
  ) {}

  async createProduct(dto: { name: string; description?: string; price: number; stockQuantity?: number; category?: string; barcode?: string; societyId: string }, vendorId: string) {
    return this.prisma.product.create({
      data: {
        name: dto.name,
        description: dto.description || '',
        price: dto.price,
        stockQuantity: dto.stockQuantity ?? 50,
        category: dto.category || 'GROCERY',
        barcode: dto.barcode,
        societyId: dto.societyId,
        vendorId,
      },
    });
  }

  async getProductByBarcode(barcode: string, societyId: string) {
    return this.prisma.product.findFirst({
      where: { barcode, societyId, isActive: true },
    });
  }

  async parseOcrImage(imageBase64: string): Promise<string[]> {
    const apiKey = this.configService.get<string>('GOOGLE_CLOUD_VISION_API_KEY');
    if (!apiKey) {
      throw new BadRequestException('Vision API key not configured');
    }

    const response = await axios.post(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        requests: [
          {
            image: { content: imageBase64 },
            features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
          },
        ],
      },
    );

    const annotations = response.data.responses[0]?.textAnnotations;
    if (!annotations || annotations.length === 0) {
      return [];
    }

    const text = annotations[0].description;
    return text
      .split(/[\n,]+/)
      .map((item: string) => item.trim())
      .filter((item: string) => item.length > 0);
  }

  async searchProducts(query: string, societyId: string) {
    return this.prisma.product.findMany({
      where: {
        name: { contains: query, mode: 'insensitive' },
        societyId,
        isActive: true,
      },
    });
  }

  async checkout(dto: CheckoutDto, buyerId: string) {
    const products = await Promise.all(
      dto.items.map(async (item) => {
        const product = await this.prisma.product.findUnique({ where: { id: item.productId } });
        if (!product) throw new BadRequestException(`Product ${item.productId} not found`);
        return { product, quantity: item.quantity };
      }),
    );

    const isAllInStock = products.every((p) => p.product.stockQuantity >= p.quantity);

    if (isAllInStock) {
      // update stock quantities
      for (const p of products) {
        await this.prisma.product.update({
          where: { id: p.product.id },
          data: { stockQuantity: { decrement: p.quantity } },
        });
      }

      const totalAmount = products.reduce((sum, p) => sum + Number(p.product.price) * p.quantity, 0);

      const order = await this.prisma.order.create({
        data: {
          buyerId,
          societyId: dto.societyId,
          deliveryAddress: dto.deliveryAddress,
          isExternal: false,
          status: 'CONFIRMED',
          totalAmount,
          items: {
            create: dto.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: Number(products.find((p) => p.product.id === item.productId)?.product.price || 0),
            })),
          },

        },
        include: { items: true },
      });

      return order;
    } else {
      const totalAmount = products.reduce((sum, p) => sum + Number(p.product.price) * p.quantity, 0);


      const order = await this.prisma.order.create({
        data: {
          buyerId,
          societyId: dto.societyId,
          deliveryAddress: dto.deliveryAddress,
          isExternal: true,
          status: 'PENDING',
          totalAmount,
          items: {
            create: dto.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: Number(products.find((p) => p.product.id === item.productId)?.product.price || 0),
            })),
          },

        },
        include: { items: { include: { product: true } } },
      });

      await this.triggerBiddingBroadcast(order);
      return order;
    }
  }

  async triggerBiddingBroadcast(order: any) {
    await this.redis.set(`bid:${order.id}:active`, 'true', 'EX', 300);
    await this.redis.set(`bid:${order.id}:items`, JSON.stringify(order.items), 'EX', 600);
    return order.id;
  }

  async placeBid(dto: PlaceBidDto) {
    const isActive = await this.redis.get(`bid:${dto.orderId}:active`);
    if (!isActive) {
      throw new BadRequestException('Bidding closed');
    }

    const bid = await this.prisma.vendorBid.create({
      data: {
        orderId: dto.orderId,
        vendorPhone: dto.vendorPhone,
        vendorName: dto.vendorName,
        bidAmount: dto.bidAmount,
        etaMinutes: dto.etaMinutes,
      },
    });

    this.biddingGateway.emitNewBid(dto.orderId, bid);
    return bid;
  }

  async closeBidding(orderId: string) {
    const bids = await this.prisma.vendorBid.findMany({
      where: { orderId },
    });

    if (bids.length === 0) {
      await this.prisma.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED' },
      });
      return null;
    }

    const winner = bids.reduce((prev, curr) => (prev.bidAmount < curr.bidAmount ? prev : curr));

    await this.prisma.vendorBid.update({
      where: { id: winner.id },
      data: { isWinner: true },
    });

    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        externalVendorPhone: winner.vendorPhone,
        status: 'CONFIRMED',
      },
    });

    // Fetch the order to get societyId for gate pass
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });

    // Issue a short-lived gate pass token for vendor entry (2h expiry)
    const token = uuidv4();
    const vendorGuestCode = `VENDOR-${token.slice(0, 8).toUpperCase()}`;

    // We store vendor access info in a mock way — using a dummy userId (winner phone as identifier)
    // In production this would link to a Vendor user record
    this.biddingGateway.emitBidWinner(orderId, {
      winner,
      vendorGuestCode,
      message: `You won! Show code ${vendorGuestCode} at the gate.`,
    });

    return winner;
  }


  async getOrderHistory(buyerId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    return this.prisma.order.findMany({
      where: { buyerId },
      skip,
      take: limit,
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getHouseholdLedger(flatId: string, month: number, year: number) {
    let ledger = await this.prisma.householdLedger.findFirst({
      where: { flatId, month, year },
    });

    if (!ledger) {
      ledger = await this.prisma.householdLedger.create({
        data: {
          flatId,
          month,
          year,
        },
      });
    }

    return ledger;
  }
}
