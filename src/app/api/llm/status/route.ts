import { NextResponse } from 'next/server';
import { getGroqClient, getGroqModelCandidates } from '@/lib/ai/groq';

function getGroqFailureMessage(error: unknown): string {
  const status =
    typeof error === 'object' && error !== null && 'status' in error &&
    typeof error.status === 'number'
      ? error.status
      : undefined;

  if (status === 401) {
    return 'Groq rejected the API key. Check GROQ_API_KEY in .env.local, then restart the dev server.';
  }
  if (status === 403) {
    return 'Groq denied access. Check that the key is active and your account can use this model.';
  }
  if (status === 404) {
    return 'Groq did not accept the configured model or the available fallback models. Check the current model IDs in your Groq account.';
  }
  if (status === 429) {
    return 'Groq rate limit or usage quota reached. Wait and try again, or check your Groq account limits.';
  }
  if (status && status >= 500) {
    return 'Groq is temporarily unavailable. Try the connection test again shortly.';
  }
  if (status) {
    return `Groq returned HTTP ${status}. Check the model configuration and Groq account access.`;
  }

  return 'Could not reach Groq. Check the server network connection and firewall, then try again.';
}

export async function POST() {
  const groqInfo = getGroqClient();

  if (!groqInfo) {
    return NextResponse.json(
      {
        connected: false,
        configured: false,
        message: 'GROQ_API_KEY is not configured. Add it to .env.local and restart the server.',
      },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  try {
    const models = await getGroqModelCandidates(groqInfo.client, groqInfo.model);
    let lastError: unknown;

    for (const model of models) {
      try {
        await groqInfo.client.chat.completions.create({
          model,
          messages: [{ role: 'user', content: 'Reply with OK.' }],
          max_tokens: 3,
          temperature: 0,
        });

        return NextResponse.json(
          {
            connected: true,
            configured: true,
            model,
            usedFallback: model !== groqInfo.model,
          },
          { headers: { 'Cache-Control': 'no-store' } }
        );
      } catch (error: unknown) {
        lastError = error;
      }
    }

    throw lastError ?? new Error('No chat-capable Groq model is available.');
  } catch (error: unknown) {
    const status =
      typeof error === 'object' && error !== null && 'status' in error &&
      typeof error.status === 'number'
        ? error.status
        : undefined;
    console.error('[GapFinder] Groq connection test failed.', { status });
    return NextResponse.json(
      {
        connected: false,
        configured: true,
        message: getGroqFailureMessage(error),
      },
      { status: 502, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
