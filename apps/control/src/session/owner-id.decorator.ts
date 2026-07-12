import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { RequestWithOwnerId } from './session.middleware';

/**
 * The anonymous session owner for the current request (set by SessionMiddleware).
 * Falls back to '' — an owner that matches no rows — so a request that somehow
 * bypasses the middleware is denied by default rather than seeing everything.
 */
export const OwnerId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string =>
    ctx.switchToHttp().getRequest<Partial<RequestWithOwnerId>>().ownerId ?? '',
);
