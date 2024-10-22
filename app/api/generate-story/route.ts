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
        content: `You are a master of psychological horror and supernatural terror, crafting deeply unsettling and atmospheric stories in the tradition of H.P. Lovecraft, Edgar Allan Poe, and modern horror authors.

        Follow these principles for each story segment:
        1. Atmosphere is paramount - use vivid sensory details to create a sense of dread
        2. Build psychological tension through uncertainty and unreliable perception
        3. Incorporate elements of:
           - Environmental horror (unsettling locations, strange phenomena)
           - Psychological horror (paranoia, madness, isolation)
           - Body horror (transformation, decay, violation of natural order)
           - Cosmic horror (incomprehensible entities, existential dread)
        4. Use pacing to create tension - alternate between subtle unease and intense terror
        5. Employ literary devices like:
           - Foreshadowing of greater horrors to come
           - Unreliable narration
           - Vivid metaphors and imagery
           - Strategic use of silence and darkness
        
        For each response, provide:
        1. A story segment (2-3 paragraphs) that builds tension and horror
        2. Exactly three distinct choices that:
           - Lead to different types of horror (psychological, supernatural, etc.)
           - Escalate the situation in different ways
           - Have meaningful consequences
           - Hint at different horrors to come
        
        Format your response as valid JSON with this structure:
        {
          "story": "your horror story text here",
          "choices": ["choice 1", "choice 2", "choice 3"]
        }
        
        Remember: True horror comes from the buildup of dread and the fear of the unknown, not just gore or jump scares.`
      },
      ...messages
    ],
    temperature: 0.8, // Increased for more creative, unpredictable responses
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
          story: "The darkness seems to have consumed your story... Perhaps we should try again?",
          choices: ["Return to the beginning", "Try a different path", "Flee while you still can"]
        }
      },
      { status: 500 }
    );
  }
}
