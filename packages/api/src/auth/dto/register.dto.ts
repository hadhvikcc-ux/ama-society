import { IsEmail, IsIn, IsNotEmpty, IsPhoneNumber, IsString, MinLength } from 'class-validator';
import { SIGNUP_ROLE_VALUES } from '../signup-roles';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsPhoneNumber('IN')
  phone: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  societyCode: string;

  // Residents are active at once; staff roles wait for admin approval. ADMIN is not allowed.
  @IsIn(SIGNUP_ROLE_VALUES)
  role: string;
}
