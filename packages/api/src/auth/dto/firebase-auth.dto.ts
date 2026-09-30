import { IsJWT, IsNotEmpty, IsOptional, IsPhoneNumber, IsString, MaxLength } from 'class-validator';

export class FirebaseLoginDto {
  @IsJWT()
  idToken: string;
}

export class CompleteRegistrationDto {
  @IsJWT()
  registrationToken: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  // Required when signing up with Google (the phone comes from Firebase for phone OTP sign-up).
  @IsOptional()
  @IsPhoneNumber('IN')
  phone?: string;

  @IsString()
  @IsNotEmpty()
  societyCode: string;
}
