import { OpenAI } from 'openai';
import { NextRequest, NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
  }

  try {
    const { messages } = await req.json();

    if (!messages) {
      return NextResponse.json({ error: 'No messages provided' }, { status: 400 });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a creative storyteller for a spooky choose-your-own-adventure game. Generate engaging story segments and provide three choices for the user to continue the story. Respond with a JSON object containing "narration" and "choices" fields.' },
        ...messages
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error('No content generated');
    }

    return NextResponse.json(JSON.parse(content));
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: (error as Error).message || 'An error occurred during your request.' }, { status: 500 });
  }
}

export default POST;
