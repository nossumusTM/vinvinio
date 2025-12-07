import { NextResponse } from 'next/server';

interface RequestMessage {
  role: 'assistant' | 'user';
  content: string;
}

export async function POST(request: Request) {
  const { messages } = (await request.json()) as { messages?: RequestMessage[] };
  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ reply: 'Tell me what you are looking for and I will curate listings for you.' });
  }

  const normalizedMessages = messages.map((m) => ({ role: m.role, content: m.content })).slice(-12);

  if (!openaiApiKey) {
    const lastUserMessage = [...normalizedMessages].reverse().find((m) => m.role === 'user');
    return NextResponse.json({
      reply: `Here is a tailored shortlist for "${lastUserMessage?.content ?? 'your trip'}". Pick a city, dates, and guest count so I can surface the right listings.`,
    });
  }

  try {
    const completion = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are AI Force, a travel concierge for Vuola. Answer concisely with bullet points and surface relevant listing hints: where, when, and who should travel.',
          },
          ...normalizedMessages,
        ],
        temperature: 0.4,
        max_tokens: 280,
      }),
    });

    if (!completion.ok) {
      throw new Error(`OpenAI responded with ${completion.status}`);
    }

    const data = await completion.json();
    const reply = data?.choices?.[0]?.message?.content as string | undefined;
    return NextResponse.json({ reply: reply ?? 'Ask me anything about your next stay and I will tailor the results.' });
  } catch (error) {
    console.error('AI Force request failed', error);
    return NextResponse.json({ reply: 'I could not reach the AI model. Please try again in a moment.' }, { status: 200 });
  }
}