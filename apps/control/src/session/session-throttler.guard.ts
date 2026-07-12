import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Rate-limit by anonymous session rather than IP: each browser carries a stable
 * session token (set by SessionMiddleware), so limits stay correct regardless of
 * proxy/IP topology. Falls back to IP, then a shared bucket, if none is present.
 */
@Injectable()
export class SessionThrottlerGuard extends ThrottlerGuard {
  protected getTracker(req: Record<string, unknown>): Promise<string> {
    const ownerId = typeof req.ownerId === 'string' ? req.ownerId : undefined;
    const ip = typeof req.ip === 'string' ? req.ip : undefined;
    return Promise.resolve(ownerId ?? ip ?? 'anonymous');
  }
}
