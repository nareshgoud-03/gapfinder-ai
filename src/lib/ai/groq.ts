import Groq from 'groq-sdk';

const apiKey = process.env.GROQ_API_KEY;

export const groqClient = apiKey ? new Groq({ apiKey }) : null;

export const DEFAULT_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

export interface LLMResponse {
  content: string;
  provider: 'groq' | 'grounded_fallback';
  modelUsed: string;
}

/**
 * Executes a completion call against Groq LLM with retrieved context grounding.
 */
export async function callGroundedLLM(
  systemPrompt: string,
  userPrompt: string,
  temperature: number = 0.2
): Promise<LLMResponse> {
  if (groqClient) {
    try {
      const response = await groqClient.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        model: DEFAULT_MODEL,
        temperature,
        max_tokens: 1500,
      });

      const text = response.choices[0]?.message?.content || '';
      return {
        content: text,
        provider: 'groq',
        modelUsed: DEFAULT_MODEL,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('Groq API call encountered an error, falling back to local grounded generator:', msg);
    }
  }

  // Grounded fallback if Groq API key is not set or network fails
  return {
    content: generateGroundedFallbackResponse(systemPrompt, userPrompt),
    provider: 'grounded_fallback',
    modelUsed: 'Local Grounded Engine (Groq Key Unconfigured)',
  };
}

/**
 * Fallback generator when Groq API key is not present.
 * Synthesizes answer directly from the supplied retrieved context in the prompt.
 */
function generateGroundedFallbackResponse(systemPrompt: string, userPrompt: string): string {
  // Extract context from user prompt if present
  const contextMatch = userPrompt.match(/RETRIEVED CONTEXT:([\s\S]*?)(?:STUDENT QUESTION|TOPIC DETAILS|GENERATE QUESTION|$)/i);
  const context = contextMatch ? contextMatch[1].trim() : '';

  if (!context || context.length < 20) {
    return "I couldn't find sufficient information about this topic in your uploaded materials.";
  }

  return `Based strictly on your uploaded materials:

${context.slice(0, 450)}...

Key takeaway from the retrieved source: Ensure you follow the exact formula definitions and step-by-step conditions stated in your syllabus and textbook chapters.`;
}
