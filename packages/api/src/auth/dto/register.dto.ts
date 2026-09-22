import { IsEmail, IsEnum, IsNotEmpty, IsPhoneNumber, IsString, MinLength } from 'class-validator';

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

  @IsEnum(['ADMIN', 'RESIDENT', 'RESIDENT_OWNER', 'RESIDENT_TENANT', 'GUARD', 'COMMITTEE', 'VENDOR', 'SUPPLIER'])
  role: string;
}
