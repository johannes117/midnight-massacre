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

async function generateNarration(messages: ChatMessage[]) {
  const stream = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { 
        role: 'system', 
        content: 'You are a creative storyteller for a spooky choose-your-own-adventure game. Generate an engaging story segment. Only provide the narrative part, no choices.' 
      },
      ...messages
    ],
    stream: true,
    temperature: 0.7,
  });

  return stream;
}

async function generateChoices(messages: ChatMessage[], narration: string) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { 
        role: 'system', 
        content: 'Based on the following story segment, generate exactly three distinct and interesting choices for what happens next. Return only a JSON array of three strings.' 
      },
      ...messages,
      { role: 'assistant', content: narration },
    ],
    temperature: 0.7,
    response_format: { type: "json_object" },
  });

  return response;
}

export const runtime = 'edge';

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

    // Step 1: Stream the narration
    const narrationStream = await generateNarration(messages);
    let fullNarration = '';

    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        const content = chunk.choices[0]?.delta?.content || '';
        fullNarration += content;
        
        controller.enqueue(JSON.stringify({
          type: 'narration',
          content: content
        }) + '\n');
      },
      async flush(controller) {
        // Step 2: Generate choices after narration is complete
        const choicesResponse = await generateChoices(messages, fullNarration);
        const content = choicesResponse.choices[0]?.message?.content;
        
        if (content) {
          const choices = JSON.parse(content);
          controller.enqueue(JSON.stringify({
            type: 'choices',
            content: choices.choices
          }) + '\n');
        }
      }
    });

    const readableStream = narrationStream.toReadableStream();
    
    return new Response(readableStream.pipeThrough(transformStream), {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        error: (error as Error).message || 'An error occurred during your request.' 
      }), 
      { status: 500 }
    );
  }
}