import { IsBoolean, IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { PoolParticipantRole, SurplusResolution } from '@prisma/client';

export class CreatePoolDto {
  @IsString() title: string;
  @IsString() description: string;
  @IsDateString() eventDate: string;
  @IsNumber() @Min(0) totalEstimatedBudget: number;
  @IsInt() @Min(1) @Max(100) approvalThreshold: number = 60;
}

export class JoinPoolDto {
  @IsEnum(PoolParticipantRole) participantRole: PoolParticipantRole;
  @IsOptional() @IsNumber() @Min(0) sponsorAmount?: number;
}

export class UploadBudgetDto {
  items: Array<{ description: string; estimatedAmount: number }>;
}

export class CastVoteDto {
  @IsBoolean() approved: boolean;
}

export class LogExpenseDto {
  @IsUUID() itemId: string;
  @IsNumber() @Min(0) actualAmount: number;
  @IsOptional() @IsString() receiptUrl?: string;
}

export class SurplusResolutionDto {
  @IsEnum(SurplusResolution) resolution: SurplusResolution;
}
