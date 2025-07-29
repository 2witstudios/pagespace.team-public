import { NextResponse } from 'next/server';
import { db, userAiSettings, users, eq, and } from '@pagespace/db';
import { z } from 'zod';
import { authenticateRequest } from '@/app/api/ai/shared/auth';
import { encrypt } from '@pagespace/lib/server';

const settingsSchema = z.object({
  provider: z.string().optional(),
  apiKey: z.string().optional(),
  baseUrl: z.string().optional(),
  lastUsedAiModel: z.string().optional(),
});

const deleteSettingsSchema = z.object({
  provider: z.string(),
});

// Get all settings for the authenticated user
export async function GET(request: Request) {
  const { userId, error } = await authenticateRequest(request);
  if (error) return error;

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      with: {
        aiSettings: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Add a flag to indicate if an API key is set, without exposing the key itself
    const settingsWithKeyStatus = user.aiSettings.map((s: typeof userAiSettings.$inferSelect) => ({
      id: s.id,
      provider: s.provider,
      updatedAt: s.updatedAt,
      isConfigured: !!s.encryptedApiKey || !!s.baseUrl,
      baseUrl: s.baseUrl,
    }));

    return NextResponse.json({
      providers: settingsWithKeyStatus,
      lastUsedAiModel: user.lastUsedAiModel,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to fetch AI settings.' }, { status: 500 });
  }
}

// Create or update a user's AI provider setting
export async function PATCH(request: Request) {
  const { userId, error } = await authenticateRequest(request);
  if (error) return error;

  const result = settingsSchema.safeParse(await request.json());
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
  }

  const { provider, apiKey, baseUrl, lastUsedAiModel } = result.data;

  try {
    // Handle lastUsedAiModel update separately (it's stored in the users table)
    if (lastUsedAiModel !== undefined) {
      await db.update(users)
        .set({ lastUsedAiModel })
        .where(eq(users.id, userId));
      
      return NextResponse.json({ success: true, lastUsedAiModel });
    }

    // Handle provider settings
    if (!provider) {
      return NextResponse.json({ error: 'Provider is required for provider settings' }, { status: 400 });
    }

    const existingSetting = await db.query.userAiSettings.findFirst({
        where: and(eq(userAiSettings.userId, userId), eq(userAiSettings.provider, provider))
    });

    let finalSetting: typeof userAiSettings.$inferSelect;

    if (existingSetting) {
        const updateData: {
            updatedAt: Date;
            encryptedApiKey?: string | null;
            baseUrl?: string | null;
        } = {
            updatedAt: new Date(),
        };

        if (provider === 'ollama') {
          updateData.baseUrl = baseUrl;
        } else if (apiKey !== undefined) {
          updateData.encryptedApiKey = apiKey ? await encrypt(apiKey) : null;
        }

        const [updatedSetting] = await db
            .update(userAiSettings)
            .set(updateData)
            .where(eq(userAiSettings.id, existingSetting.id))
            .returning();
        finalSetting = updatedSetting;
    } else {
        const encryptedApiKey = (provider !== 'ollama' && apiKey) ? await encrypt(apiKey) : null;
        const finalBaseUrl = (provider === 'ollama') ? baseUrl : null;
        const [newSetting] = await db.insert(userAiSettings)
            .values({
                userId: userId,
                provider,
                encryptedApiKey,
                baseUrl: finalBaseUrl,
            })
            .returning();
        finalSetting = newSetting;
    }

    // Return the final state without the encrypted key
    const { encryptedApiKey, ...response } = finalSetting;
    return NextResponse.json({ ...response, isConfigured: !!encryptedApiKey || !!response.baseUrl });

  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to save AI settings.' }, { status: 500 });
  }
}

// Delete a user's API key for a specific provider
export async function DELETE(request: Request) {
  const { userId, error } = await authenticateRequest(request);
  if (error) return error;

  const result = deleteSettingsSchema.safeParse(await request.json());
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
  }

  const { provider } = result.data;

  try {
    const [updatedSetting] = await db.update(userAiSettings)
      .set({ encryptedApiKey: null, baseUrl: null })
      .where(and(eq(userAiSettings.userId, userId), eq(userAiSettings.provider, provider)))
      .returning();

    if (!updatedSetting) {
        return NextResponse.json({ error: 'Setting not found.' }, { status: 404 });
    }
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { encryptedApiKey, ...response } = updatedSetting;
    return NextResponse.json({ ...response, isConfigured: false });

  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to delete API key.' }, { status: 500 });
  }
}