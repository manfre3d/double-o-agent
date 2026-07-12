import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { SessionMiddleware } from './session.middleware';

function build(nodeEnv?: string) {
  const config = {
    get: (key: string) => (key === 'NODE_ENV' ? nodeEnv : undefined),
  } as unknown as ConfigService;
  return new SessionMiddleware(config);
}

function mockReqRes(signedCookies: Record<string, unknown> = {}) {
  const req = { signedCookies } as unknown as Request & { ownerId?: string };
  const cookie = jest.fn();
  const res = { cookie } as unknown as Response;
  return { req, res, cookie };
}

describe('SessionMiddleware', () => {
  it('mints a signed session cookie and sets req.ownerId on first visit', () => {
    const mw = build();
    const { req, res, cookie } = mockReqRes();
    const next = jest.fn();

    mw.use(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(typeof req.ownerId).toBe('string');
    expect((req.ownerId as string).length).toBeGreaterThanOrEqual(64); // 32 bytes as hex
    const [name, value, opts] = cookie.mock.calls[0] as [
      string,
      string,
      Record<string, unknown>,
    ];
    expect(name).toBe('doo_sid'); // dev (non-prod) name
    expect(value).toBe(req.ownerId);
    expect(opts).toMatchObject({
      httpOnly: true,
      sameSite: 'strict',
      signed: true,
      path: '/',
      secure: false,
    });
  });

  it('reuses an existing valid session token without re-setting the cookie', () => {
    const mw = build();
    const existing = 'a'.repeat(64);
    const { req, res, cookie } = mockReqRes({ doo_sid: existing });
    const next = jest.fn();

    mw.use(req, res, next);

    expect(req.ownerId).toBe(existing);
    expect(cookie).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('mints a fresh token when the cookie is missing or malformed (tampered)', () => {
    const mw = build();
    // A too-short / non-string value is treated as absent — a bad signature
    // drops the cookie from signedCookies entirely.
    const { req, res, cookie } = mockReqRes({ doo_sid: 'short' });
    mw.use(req, res, jest.fn());

    expect(req.ownerId).not.toBe('short');
    expect((req.ownerId as string).length).toBeGreaterThanOrEqual(64);
    expect(cookie).toHaveBeenCalledTimes(1);
  });

  it("uses the '__Host-' prefixed Secure cookie in production", () => {
    const mw = build('production');
    const { req, res, cookie } = mockReqRes();
    mw.use(req, res, jest.fn());
    const [name, , opts] = cookie.mock.calls[0] as [
      string,
      string,
      Record<string, unknown>,
    ];
    expect(name).toBe('__Host-doo_sid');
    expect(opts).toMatchObject({ secure: true });
  });
});
