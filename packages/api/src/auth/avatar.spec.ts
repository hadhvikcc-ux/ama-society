import { describe, it, expect, jest } from '@jest/globals';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AVATAR_MAX_LENGTH, UpdateAvatarDto } from './dto/firebase-auth.dto';

const errorsFor = (avatar: unknown) => validateSync(plainToInstance(UpdateAvatarDto, { avatar }));

describe('UpdateAvatarDto', () => {
  it('accepts JPEG, PNG and WebP data URLs', () => {
    for (const type of ['jpeg', 'png', 'webp']) {
      expect(errorsFor(`data:image/${type};base64,iVBORw0KGgo=`)).toHaveLength(0);
    }
  });

  it('accepts null to remove the picture', () => {
    expect(errorsFor(null)).toHaveLength(0);
  });

  it('rejects SVG, remote URLs and non-base64 payloads', () => {
    expect(errorsFor('data:image/svg+xml;base64,PHN2Zz4=')).not.toHaveLength(0);
    expect(errorsFor('https://example.com/me.jpg')).not.toHaveLength(0);
    expect(errorsFor('data:image/png;base64,<script>')).not.toHaveLength(0);
    expect(errorsFor(undefined)).not.toHaveLength(0);
  });

  it('rejects pictures over the size limit', () => {
    const big = 'data:image/jpeg;base64,' + 'A'.repeat(AVATAR_MAX_LENGTH);
    expect(errorsFor(big)).not.toHaveLength(0);
  });
});

describe('AuthService.updateAvatar', () => {
  it('stores the picture and never returns the password hash', async () => {
    const prisma: any = {
      user: {
        update: jest.fn(async ({ data }: any) => ({ id: 'u1', name: 'Asha', passwordHash: 'secret', ...data })),
      },
    };
    const config = { get: () => 'test-secret' };
    const service = new AuthService(prisma, new JwtService({}), config as any, {} as any, {} as any);

    const res: any = await service.updateAvatar('u1', 'data:image/jpeg;base64,AAAA');

    expect(prisma.user.update.mock.calls[0][0]).toMatchObject({ where: { id: 'u1' }, data: { avatarUrl: 'data:image/jpeg;base64,AAAA' } });
    expect(res.avatarUrl).toBe('data:image/jpeg;base64,AAAA');
    expect(res.passwordHash).toBeUndefined();
  });
});
