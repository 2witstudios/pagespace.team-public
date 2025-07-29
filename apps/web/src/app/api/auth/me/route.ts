import { users, db, eq } from '@pagespace/db';
import { decodeToken } from '@pagespace/lib/server';
import { parse } from 'cookie';

export async function GET(req: Request) {
  const cookieHeader = req.headers.get('cookie');
  const cookies = parse(cookieHeader || '');
  const accessTokenValue = cookies.accessToken;

  if (!accessTokenValue) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const decoded = await decodeToken(accessTokenValue);

  if (!decoded) {
    return Response.json({ error: 'Invalid token' }, { status: 401 });
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, decoded.userId),
    columns: {
      id: true,
      name: true,
      email: true,
      tokenVersion: true,
    },
  });

  if (!user || user.tokenVersion !== decoded.tokenVersion) {
    return Response.json({ error: 'Invalid token version' }, { status: 401 });
  }

  return Response.json({
    id: user.id,
    name: user.name,
    email: user.email,
  });
}