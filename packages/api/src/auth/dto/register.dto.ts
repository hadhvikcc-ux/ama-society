import { IsEmail, IsIn, IsNotEmpty, IsPhoneNumber, IsString, MinLength } from 'class-validator';

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

  // Self-registration is limited to residents; staff and admin roles must be granted by an admin.
  @IsIn(['RESIDENT', 'RESIDENT_OWNER', 'RESIDENT_TENANT'])
  role: string;
}
