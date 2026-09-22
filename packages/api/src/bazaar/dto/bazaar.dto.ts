import { IsString, IsOptional, IsNumber, Min, IsInt, IsUUID, IsEnum } from 'class-validator';

export class CreateProductDto {
  @IsString() name: string;
  @IsString() description: string;
  @IsOptional() @IsString() barcode?: string;
  @IsString() category: string;
  @IsNumber() @Min(0) price: number;
  @IsInt() @Min(0) stockQuantity: number;
  @IsOptional() @IsString() imageUrl?: string;
  @IsUUID() societyId: string;
}

export class UpdateStockDto {
  @IsInt() quantity: number;
}

import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';

export class CartItemDto {
  @IsUUID() productId: string;
  @IsInt() @Min(1) quantity: number;
}

export class CheckoutDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  items: CartItemDto[];

  @IsString() deliveryAddress: string;
  @IsUUID() societyId: string;
  @IsOptional() @IsEnum(['FASTEST', 'CHEAPEST']) preference?: string;
}

export class PlaceBidDto {
  @IsUUID() orderId: string;
  @IsString() vendorPhone: string;
  @IsString() vendorName: string;
  @IsNumber() @Min(0) bidAmount: number;
  @IsInt() @Min(1) etaMinutes: number;
}

export class OcrDto {
  @IsString() imageBase64: string;
}
