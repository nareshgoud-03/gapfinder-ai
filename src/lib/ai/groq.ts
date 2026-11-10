import Groq from 'groq-sdk';

export interface LLMResponse {
  content: string;
  provider: 'groq' | 'grounded_fallback';
  modelUsed: string;
}

/**
 * Returns an initialized Groq client using the latest environment variables.
 */
export function getGroqClient(): { client: Groq; model: string } | null {
  const rawKey = process.env.GROQ_API_KEY || '';
  const apiKey = rawKey.trim().replace(/^["']|["']$/g, '');
  if (!apiKey || apiKey.includes('your_groq_api_key') || apiKey.length < 10) {
    return null;
  }
  const model = process.env.GROQ_MODEL?.trim() || 'openai/gpt-oss-120b';
  return { client: new Groq({ apiKey }), model };
}

/**
 * Returns a list of candidate model IDs to try on Groq.
 */
export async function getGroqModelCandidates(client?: Groq, preferredModel?: string): Promise<string[]> {
  const defaults = [
    preferredModel || process.env.GROQ_MODEL?.trim() || 'openai/gpt-oss-120b',
    'openai/gpt-oss-120b',
    'openai/gpt-oss-20b',
    'qwen/qwen3.8-27b',
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant',
  ];

  if (client) {
    try {
      const list = await client.models.list();
      if (Array.isArray(list.data) && list.data.length > 0) {
        const available = list.data.map((m: any) => m.id);
        const filtered = defaults.filter((m) => available.includes(m));
        if (filtered.length > 0) return filtered;
        return available;
      }
    } catch {
      // Fallback to static defaults
    }
  }

  return Array.from(new Set(defaults.filter(Boolean)));
}

/**
 * Executes a completion call against Groq LLM with retrieved context grounding.
 */
export async function callGroundedLLM(
  systemPrompt: string,
  userPrompt: string,
  temperature: number = 0.2,
  maxTokens: number = 4000
): Promise<LLMResponse> {
  const groqInfo = getGroqClient();

  if (groqInfo) {
    const { client, model } = groqInfo;
    // Supported models on this endpoint
    const candidateModels = [
      model,
      'openai/gpt-oss-120b',
      'openai/gpt-oss-20b',
      'qwen/qwen3.8-27b',
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
    ];
    const modelsToTry = Array.from(new Set(candidateModels.filter(Boolean)));

    for (const currentModel of modelsToTry) {
      try {
        const response = await client.chat.completions.create({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          model: currentModel,
          temperature,
          max_tokens: maxTokens,
        });

        const text = response.choices[0]?.message?.content || '';
        if (text && text.trim().length > 0) {
          return {
            content: text,
            provider: 'groq',
            modelUsed: currentModel,
          };
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`Groq API attempt on model "${currentModel}" failed:`, msg);
      }
    }
  }

  // Grounded fallback if Groq API key is not configured or network calls fail
  return {
    content: generateGroundedFallbackResponse(systemPrompt, userPrompt),
    provider: 'grounded_fallback',
    modelUsed: 'Local Grounded Engine (Groq Key Unconfigured)',
  };
}

/**
 * Fallback generator when Groq API key is not present.
 */
function generateGroundedFallbackResponse(systemPrompt: string, userPrompt: string): string {
  const contextMatch = userPrompt.match(/RETRIEVED CONTEXT:([\s\S]*?)(?:STUDENT QUESTION|TOPIC DETAILS|GENERATE QUESTION|$)/i);
  const context = contextMatch ? contextMatch[1].trim() : '';

  if (!context || context.length < 20) {
    return "I couldn't find sufficient information about this topic in your uploaded materials.";
  }

  return `Based strictly on your uploaded materials:

${context.slice(0, 450)}...

Key takeaway from the retrieved source: Ensure you follow the exact formula definitions and step-by-step conditions stated in your syllabus and textbook chapters.`;
}
