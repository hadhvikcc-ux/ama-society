import { IsEnum, IsString, IsOptional, IsBoolean, IsUUID, IsNotEmpty, MaxLength } from 'class-validator';

export enum ChatChannelType {
  PUBLIC = 'PUBLIC',
  COMMITTEE = 'COMMITTEE',
  SECURITY_ALERT = 'SECURITY_ALERT',
  PRIVATE = 'PRIVATE',
}

export class CreateChannelDto {
  @IsEnum(ChatChannelType) type: ChatChannelType;
  @IsString() name: string;
  @IsOptional() @IsString() description?: string;
  @IsBoolean() @IsOptional() isEncrypted?: boolean;
  @IsUUID() societyId: string;
}

export class SendMessageDto {
  @IsUUID() channelId: string;
  @IsString() @IsNotEmpty() @MaxLength(5000) content: string;
}
