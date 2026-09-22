import { IsEnum, IsNotEmpty, IsOptional, IsPhoneNumber, IsString, IsUUID, Length } from 'class-validator';

export enum VisitPurpose {
  DELIVERY = 'DELIVERY',
  GUEST = 'GUEST',
  SERVICE = 'SERVICE',
  CAB = 'CAB'
}

export enum VisitCategory {
  ONE_TIME = 'ONE_TIME',
  FREQUENT = 'FREQUENT',
  STAY_OVER = 'STAY_OVER'
}

export class ScanQrDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class SendOtpDto {
  @IsPhoneNumber('IN')
  phone: string;
}

export class VerifyOtpDto {
  @IsPhoneNumber('IN')
  phone: string;

  @IsString()
  @Length(6, 6)
  code: string;

  @IsEnum(VisitPurpose)
  purpose: VisitPurpose;

  @IsUUID()
  flatId: string;

  @IsString()
  visitorName: string;

  @IsEnum(VisitCategory)
  category: VisitCategory;

  @IsOptional()
  @IsString()
  plateNumber?: string;
}
