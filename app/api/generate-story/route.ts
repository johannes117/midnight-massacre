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

interface StreamChunk {
  type: 'narration' | 'choices' | 'error';
  content: string | string[];
}

async function generateStorySegment(messages: ChatMessage[]) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { 
        role: 'system', 
        content: 'You are a creative storyteller for a spooky choose-your-own-adventure game. Generate an engaging story segment.' 
      },
      ...messages
    ],
    stream: false,
    temperature: 0.7,
  });

  return response.choices[0]?.message?.content || '';
}

async function generateChoices(narration: string) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { 
        role: 'system', 
        content: 'Based on this story segment, generate exactly three distinct and interesting choices for what happens next. Return only a JSON object with a "choices" array containing three strings.' 
      },
      { role: 'user', content: narration }
    ],
    temperature: 0.7,
    response_format: { type: "json_object" },
  });

  return response.choices[0]?.message?.content || '';
}

export const runtime = 'edge';

function createReadableStream(asyncGenerator: AsyncGenerator<Uint8Array>) {
  return new ReadableStream({
    async pull(controller) {
      const { value, done } = await asyncGenerator.next();
      if (done) {
        controller.close();
      } else {
        controller.enqueue(value);
      }
    },
  });
}

async function* generateStoryStream(messages: ChatMessage[]): AsyncGenerator<Uint8Array> {
  try {
    // Step 1: Generate the story segment
    const narration = await generateStorySegment(messages);
    
    // Stream the narration word by word for a more natural effect
    const words = narration.split(' ');
    for (const word of words) {
      const chunk: StreamChunk = { type: 'narration', content: word + ' ' };
      yield new TextEncoder().encode(JSON.stringify(chunk) + '\n');
      await new Promise(resolve => setTimeout(resolve, 50)); // Small delay between words
    }

    // Step 2: Generate the choices
    const choicesResponse = await generateChoices(narration);
    try {
      const parsedChoices = JSON.parse(choicesResponse);
      if (parsedChoices?.choices && Array.isArray(parsedChoices.choices)) {
        const chunk: StreamChunk = { 
          type: 'choices', 
          content: parsedChoices.choices 
        };
        yield new TextEncoder().encode(JSON.stringify(chunk) + '\n');
      } else {
        throw new Error('Invalid choices format');
      }
    } catch {
      // Fallback choices if parsing fails
      const fallbackChunk: StreamChunk = {
        type: 'choices',
        content: ['Continue the story', 'Start over', 'Return to menu']
      };
      yield new TextEncoder().encode(JSON.stringify(fallbackChunk) + '\n');
    }
  } catch (err) {
    console.error('Error in story generation:', err);
    const errorChunk: StreamChunk = {
      type: 'error',
      content: 'An error occurred while generating the story.'
    };
    yield new TextEncoder().encode(JSON.stringify(errorChunk) + '\n');
  }
}

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'OpenAI API key not configured' }), 
      { status: 500 }
    );
  }

  try {
    const { messages } = await req.json() as { messages: ChatMessage[] };
    if (!messages) {
      return new Response(
        JSON.stringify({ error: 'No messages provided' }), 
        { status: 400 }
      );
    }

    const stream = createReadableStream(generateStoryStream(messages));

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ 
        error: err instanceof Error ? err.message : 'An error occurred'
      }), 
      { status: 500 }
    );
  }
}