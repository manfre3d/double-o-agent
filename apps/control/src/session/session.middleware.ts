import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

/** Express request carrying the resolved anonymous session owner. */
export type RequestWithOwnerId = Request & { ownerId: string };

/**
 * 30 days — outlives the mission retention window, so a returning browser keeps
 * its session even after its old missions have been purged.
 */
const COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Gives every browser a stable, opaque session token via a signed cookie and
 * exposes it as `req.ownerId` — the identity all mission queries scope to
 * (the OWASP A01 / broken-access-control fix). The token is anonymous: no login.
 */
@Injectable()
export class SessionMiddleware implements NestMiddleware {
  /** '__Host-' + Secure need HTTPS, which dev (http://localhost) can't provide. */
  private readonly secure: boolean;
  private readonly cookieName: string;

  constructor(private readonly config: ConfigService) {
    this.secure = this.config.get('NODE_ENV') === 'production';
    this.cookieName = this.secure ? '__Host-doo_sid' : 'doo_sid';
  }

  use(req: Request, res: Response, next: NextFunction): void {
    const current = (req.signedCookies as Record<string, unknown> | undefined)?.[
      this.cookieName
    ];
    let ownerId =
      typeof current === 'string' && current.length >= 32 ? current : undefined;

    if (!ownerId) {
      ownerId = randomBytes(32).toString('hex'); // 256-bit, above OWASP's 128-bit floor
      res.cookie(this.cookieName, ownerId, {
        httpOnly: true,
        secure: this.secure,
        sameSite: 'strict',
        signed: true,
        path: '/',
        maxAge: COOKIE_MAX_AGE_MS,
      });
    }

    (req as RequestWithOwnerId).ownerId = ownerId;
    next();
  }
}
