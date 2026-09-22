import { IsEmail, IsNotEmpty, IsPhoneNumber, IsString, Length } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class OtpRequestDto {
  @IsPhoneNumber('IN')
  phone: string;
}

export class OtpVerifyDto {
  @IsPhoneNumber('IN')
  phone: string;

  @IsString()
  @Length(6, 6)
  code: string;
}

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
