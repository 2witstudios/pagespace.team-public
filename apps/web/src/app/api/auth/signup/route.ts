import { users, drives, userAiSettings, db, eq } from '@pagespace/db';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { slugify } from '@pagespace/lib/server';
import { createId } from '@paralleldrive/cuid2';

const signupSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters long" }),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = signupSchema.safeParse(body);

    if (!validation.success) {
      return Response.json({ errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { name, email, password } = validation.data;

    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return Response.json({ error: 'User with this email already exists' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await db.insert(users).values({
      id: createId(),
      name,
      email,
      password: hashedPassword,
      lastUsedAiModel: 'ollama:qwen3:8b',
    }).returning().then(res => res[0]);

    // Create a personal drive for the new user
    const driveName = `${user.name}'s Drive`;
    await db.insert(drives).values({
      name: driveName,
      slug: slugify(driveName),
      ownerId: user.id,
      updatedAt: new Date(),
    });

    // Add default 'ollama' provider for the new user with Docker-compatible URL
    await db.insert(userAiSettings).values({
      userId: user.id,
      provider: 'ollama',
      baseUrl: 'http://host.docker.internal:11434',
      updatedAt: new Date(),
    });

    return Response.json({ message: 'User created successfully' }, { status: 201 });
  } catch (error) {
    console.error('Signup error:', error);
    return Response.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}