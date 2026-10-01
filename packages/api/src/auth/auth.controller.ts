import { Controller, Post, Body, Get, Patch, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto, OtpRequestDto, OtpVerifyDto, RefreshTokenDto } from './dto/login.dto';
import { CompleteRegistrationDto, FirebaseLoginDto, UpdateAvatarDto } from './dto/firebase-auth.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // Google sign-in or phone OTP (Firebase Authentication ID token).
  @Post('firebase')
  @HttpCode(HttpStatus.OK)
  async firebaseLogin(@Body() dto: FirebaseLoginDto) {
    return this.authService.firebaseLogin(dto.idToken);
  }

  @Post('register/complete')
  async completeRegistration(@Body() dto: CompleteRegistrationDto) {
    return this.authService.completeRegistration(dto);
  }

  @Post('otp/send')
  @HttpCode(HttpStatus.OK)
  async sendOtp(@Body() dto: OtpRequestDto) {
    await this.authService.sendOtp(dto.phone);
    return { success: true, message: 'OTP sent successfully' };
  }

  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() dto: OtpVerifyDto) {
    await this.authService.verifyOtp(dto.phone, dto.code);
    return { success: true, message: 'OTP verified successfully' };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getMe(@CurrentUser() user: any) {
    return this.authService.getMe(user.id);
  }

  // Set or remove (avatar: null) the signed-in user's profile picture.
  @Patch('me/avatar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async updateAvatar(@CurrentUser() user: any, @Body() dto: UpdateAvatarDto) {
    return this.authService.updateAvatar(user.id, dto.avatar);
  }
}
