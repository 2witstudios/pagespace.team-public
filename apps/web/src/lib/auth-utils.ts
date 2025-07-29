import * as jose from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-default-secret'
);
const ACCESS_TOKEN_EXPIRES_IN = '15m';
const REFRESH_TOKEN_EXPIRES_IN = '7d';
const JWT_ALGORITHM = 'HS256';

interface UserPayload extends jose.JWTPayload {
  userId: string;
  tokenVersion: number;
}

export async function generateAccessToken(user: { id: string; tokenVersion: number }) {
  return await new jose.SignJWT({
    userId: user.id,
    tokenVersion: user.tokenVersion,
  })
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRES_IN)
    .sign(JWT_SECRET);
}

export async function generateRefreshToken(user: { id: string; tokenVersion: number }) {
  return await new jose.SignJWT({
    userId: user.id,
    tokenVersion: user.tokenVersion,
  })
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRES_IN)
    .sign(JWT_SECRET);
}

export async function decodeToken(token: string): Promise<UserPayload | null> {
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET);
    return payload as UserPayload;
  } catch (error) {
    console.error('Invalid token:', error);
    return null;
  }
}

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function authenticatePage() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('accessToken')?.value;

  if (!accessToken) {
    redirect('/auth/signin');
  }

  const decoded = await decodeToken(accessToken);
  if (!decoded) {
    redirect('/auth/signin');
  }

  return { userId: decoded.userId };
}