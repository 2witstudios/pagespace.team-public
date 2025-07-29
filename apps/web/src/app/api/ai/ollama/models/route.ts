import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/app/api/ai/shared/auth';
import { resolveModel } from '@/app/api/ai/shared/models';

export async function GET(request: Request) {
  const { userId, error } = await authenticateRequest(request);
  if (error) return error;

  try {
    // We use a dummy model name to resolve the baseUrl
    const { baseUrl } = await resolveModel(userId, 'ollama:dummy');

    if (!baseUrl) {
      return NextResponse.json({ error: 'Ollama base URL is not configured.' }, { status: 400 });
    }

    const response = await fetch(`${baseUrl}/api/tags`);
    if (!response.ok) {
      throw new Error('Failed to fetch models from Ollama.');
    }

    const { models } = await response.json();
    
    const formattedModels = models.map((model: { name: string }) => ({
      value: `ollama:${model.name}`,
      label: model.name,
    }));

    return NextResponse.json(formattedModels);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to fetch Ollama models.' }, { status: 500 });
  }
}