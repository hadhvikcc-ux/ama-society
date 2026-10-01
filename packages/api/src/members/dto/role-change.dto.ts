import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { MEMBER_ROLE_KEYS } from '../member-roles';

export class CreateRoleChangeDto {
  @IsIn(MEMBER_ROLE_KEYS)
  role: string;

  // Shown to the President with the request.
  @IsOptional()
  @IsString()
  @MaxLength(300)
  reason?: string;
}
