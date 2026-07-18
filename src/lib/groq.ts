/**
 * Thin Groq wrapper. Groq's API is OpenAI-compatible so we call it with
 * fetch directly rather than adding another SDK. Falls back cleanly when
 * GROQ_API_KEY is not set — the /insights endpoint returns a helpful
 * message rather than a 500.
 */

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

export type GroqMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export async function groqChat(messages: GroqMessage[]): Promise<
  { ok: true; content: string } | { ok: false; error: string }
> {
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    return {
      ok: false,
      error: 'Groq is not configured. Add GROQ_API_KEY to enable AI insights.',
    };
  }

  try {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: 0.4,
        max_tokens: 900,
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      return { ok: false, error: `Groq API error (${res.status}): ${detail.slice(0, 200)}` };
    }
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) return { ok: false, error: 'Groq returned no content.' };
    return { ok: true, content };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Unknown error.' };
  }
}
