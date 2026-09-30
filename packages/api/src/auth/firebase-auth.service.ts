import { Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { App, getApps, initializeApp } from 'firebase-admin/app';
import { DecodedIdToken, getAuth } from 'firebase-admin/auth';

/**
 * Verifies Firebase Authentication ID tokens (Google sign-in and phone OTP).
 * Verification only needs the Firebase project ID: the signing certificates are public,
 * so no service-account key is required on Cloud Run.
 */
@Injectable()
export class FirebaseAuthService {
  private app?: App;

  constructor(private readonly configService: ConfigService) {}

  private getApp(): App {
    if (this.app) return this.app;
    const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
    if (!projectId) {
      throw new ServiceUnavailableException('Google and phone sign-in are not configured');
    }
    this.app = getApps().find((a) => a.name === 'ama-auth') ?? initializeApp({ projectId }, 'ama-auth');
    return this.app;
  }

  async verifyIdToken(idToken: string): Promise<DecodedIdToken> {
    const auth = getAuth(this.getApp());
    try {
      return await auth.verifyIdToken(idToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired sign-in token');
    }
  }
}
