import { users, refreshTokens } from '@pagespace/db';
import { db, eq, sql } from '@pagespace/db';
import { decodeToken, generateAccessToken, generateRefreshToken, checkRateLimit, RATE_LIMIT_CONFIGS } from '@pagespace/lib/server';
import { serialize } from 'cookie';
import { parse } from 'cookie';
import { createId } from '@paralleldrive/cuid2';

export async function POST(req: Request) {
  const cookieHeader = req.headers.get('cookie');
  const cookies = parse(cookieHeader || '');
  const refreshTokenValue = cookies.refreshToken;

  if (!refreshTokenValue) {
    return Response.json({ error: 'Refresh token not found.' }, { status: 401 });
  }

  // Rate limiting by IP address for refresh attempts
  const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                   req.headers.get('x-real-ip') || 
                   'unknown';
  
  const rateLimit = checkRateLimit(`refresh:${clientIP}`, RATE_LIMIT_CONFIGS.REFRESH);
  
  if (!rateLimit.allowed) {
    return Response.json(
      { 
        error: 'Too many refresh attempts. Please try again later.',
        retryAfter: rateLimit.retryAfter 
      }, 
      { 
        status: 429,
        headers: {
          'Retry-After': rateLimit.retryAfter?.toString() || '300'
        }
      }
    );
  }

  // Check if the token has been used before by checking against the database
  const existingToken = await db.query.refreshTokens.findFirst({
    where: eq(refreshTokens.token, refreshTokenValue),
    with: {
      user: true,
    },
  });

  // If token doesn't exist, it might have been stolen and used.
  // For added security, we can check if the decoded token is valid and if so,
  // invalidate all sessions for that user.
  if (!existingToken) {
    const decoded = await decodeToken(refreshTokenValue);
    if (decoded) {
      // This is a critical security event. A refresh token that is not in the DB was used.
      // It could be a stolen, already-used token. Invalidate all user sessions.
      await db.update(users)
        .set({ tokenVersion: sql`${users.tokenVersion} + 1` })
        .where(eq(users.id, decoded.userId));
    }
    return Response.json({ error: 'Invalid refresh token.' }, { status: 401 });
  }

  // It's a valid, one-time use token. Invalidate it immediately.
  await db.delete(refreshTokens).where(eq(refreshTokens.id, existingToken.id));

  const { user } = existingToken;

  // Verify the token version to ensure it's not from an old session
  const decoded = await decodeToken(refreshTokenValue);
  if (!decoded || decoded.tokenVersion !== user.tokenVersion) {
    return Response.json({ error: 'Invalid refresh token version.' }, { status: 401 });
  }

  // Issue a new pair of tokens
  const newAccessToken = await generateAccessToken(user.id, user.tokenVersion);
  const newRefreshToken = await generateRefreshToken(user.id, user.tokenVersion);

  // Store the new refresh token
  await db.insert(refreshTokens).values({
    id: createId(),
    token: newRefreshToken,
    userId: user.id,
    device: req.headers.get('user-agent'),
    ip: clientIP,
  });

  const isProduction = process.env.NODE_ENV === 'production';

  const accessTokenCookie = serialize('accessToken', newAccessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 15, // 15 minutes
    ...(isProduction && { domain: process.env.COOKIE_DOMAIN })
  });

  const refreshTokenCookie = serialize('refreshToken', newRefreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    ...(isProduction && { domain: process.env.COOKIE_DOMAIN })
  });

  const headers = new Headers();
  headers.append('Set-Cookie', accessTokenCookie);
  headers.append('Set-Cookie', refreshTokenCookie);

  return Response.json({ message: 'Token refreshed successfully' }, { status: 200, headers });
}