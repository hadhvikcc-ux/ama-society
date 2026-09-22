import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Req, ParseIntPipe } from '@nestjs/common';
import { BazaarService } from './bazaar.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CheckoutDto, OcrDto, PlaceBidDto, UpdateStockDto } from './dto/bazaar.dto';

@Controller('bazaar')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BazaarController {
  constructor(private readonly bazaarService: BazaarService) {}

  @Post('catalog')
  @Roles('VENDOR', 'ADMIN')
  async createProduct(@Body() dto: any, @Req() req: any) {
    return this.bazaarService.createProduct(dto, req.user.id);
  }

  @Patch('catalog/:id/stock')
  @Roles('VENDOR')
  async updateStock(@Param('id') id: string, @Body() dto: UpdateStockDto) {
    return { status: 'success' };
  }

  @Get('scan/:barcode')
  @Roles('RESIDENT')
  async scanBarcode(@Param('barcode') barcode: string, @Query('societyId') societyId: string) {
    return this.bazaarService.getProductByBarcode(barcode, societyId);
  }

  @Get('search')
  @Roles('RESIDENT')
  async search(@Query('q') query: string, @Query('societyId') societyId: string) {
    return this.bazaarService.searchProducts(query, societyId);
  }

  @Post('ocr')
  @Roles('RESIDENT')
  async parseOcr(@Body() dto: OcrDto) {
    return this.bazaarService.parseOcrImage(dto.imageBase64);
  }

  @Post('cart/checkout')
  @Roles('RESIDENT')
  async checkout(@Body() dto: CheckoutDto, @Req() req: any) {
    return this.bazaarService.checkout(dto, req.user.id);
  }

  @Post('bid')
  // no auth for vendor bids
  async placeBid(@Body() dto: PlaceBidDto) {
    return this.bazaarService.placeBid(dto);
  }

  @Get('orders')
  @Roles('RESIDENT')
  async getOrders(
    @Req() req: any,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 20,
  ) {
    return this.bazaarService.getOrderHistory(req.user.id, page, limit);
  }

  @Get('ledger/:flatId')
  @Roles('RESIDENT', 'ADMIN')
  async getLedger(
    @Param('flatId') flatId: string,
    @Query('month', ParseIntPipe) month: number,
    @Query('year', ParseIntPipe) year: number,
  ) {
    return this.bazaarService.getHouseholdLedger(flatId, month, year);
  }
}
