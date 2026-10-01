import { IsIn, IsJWT, IsNotEmpty, IsOptional, IsPhoneNumber, IsString, Matches, MaxLength, ValidateIf } from 'class-validator';
import { SIGNUP_ROLE_VALUES } from '../signup-roles';

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

  // Defaults to RESIDENT_OWNER. Staff roles wait for admin approval; ADMIN is not allowed.
  @IsOptional()
  @IsIn(SIGNUP_ROLE_VALUES)
  role?: string;
}

/** Max length of a profile picture data URL (~300 KB of image). The app sends ~20-40 KB. */
export const AVATAR_MAX_LENGTH = 400_000;

export class UpdateAvatarDto {
  // A base64 data URL for a JPEG, PNG or WebP image, or null to remove the picture.
  // SVG is not accepted: it can carry scripts.
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(AVATAR_MAX_LENGTH, { message: 'Profile picture is too large. Please choose a smaller photo.' })
  @Matches(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/, {
    message: 'Profile picture must be a JPEG, PNG or WebP image.',
  })
  avatar: string | null;
}
