// /app/api/generate-story/route.ts
import { OpenAI } from 'openai';
import { NextRequest } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export const runtime = 'edge';

async function generateStoryResponse(messages: ChatMessage[]) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a creative storyteller for a spooky choose-your-own-adventure game. 
        For each response, provide:
        1. A story segment (2-3 paragraphs)
        2. Exactly three distinct choices for what happens next
        
        Format your response as valid JSON with this structure:
        {
          "story": "your story text here",
          "choices": ["choice 1", "choice 2", "choice 3"]
        }`
      },
      ...messages
    ],
    temperature: 0.7,
    response_format: { type: "json_object" },
  });

  return completion.choices[0]?.message?.content || '';
}

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return Response.json(
      { error: 'OpenAI API key not configured' },
      { status: 500 }
    );
  }

  try {
    const { messages } = await req.json() as { messages: ChatMessage[] };
    if (!messages) {
      return Response.json(
        { error: 'No messages provided' },
        { status: 400 }
      );
    }

    const response = await generateStoryResponse(messages);
    return Response.json(JSON.parse(response));
    
  } catch (err) {
    console.error('Error generating story:', err);
    return Response.json(
      { 
        error: err instanceof Error ? err.message : 'An error occurred',
        fallback: {
          story: "Something went wrong with the story generation...",
          choices: ["Try again", "Start over", "Return to menu"]
        }
      },
      { status: 500 }
    );
  }
}