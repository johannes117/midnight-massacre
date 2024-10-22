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

// Game state interface to track player progress
interface GameState {
  hasWeapon: boolean;
  hasKey: boolean;
  tension: number;
  encounterCount: number;
}

const INITIAL_GAME_STATE: GameState = {
  hasWeapon: false,
  hasKey: false,
  tension: 0,
  encounterCount: 0,
};

const SYSTEM_PROMPT = `You are crafting an interactive slasher horror story in the tradition of Halloween and Friday the 13th. 
The story follows a protagonist being hunted by an unstoppable masked killer known as "The Stalker" through a small town during Halloween night.

Core Elements:
1. Goal: The player must survive the night by either escaping or, if they've found the right items, confronting the killer
2. The Stalker: An emotionless, relentless killer who becomes more aggressive as the story progresses
3. Setting: A small town during Halloween night, with locations like houses, streets, shops, and dark alleys
4. Items: The player can find weapons, keys, or tools to aid their escape

Story Rules:
1. Build tension through environmental details, unsettling sounds, and glimpses of The Stalker
2. Create a sense of being hunted - The Stalker is always nearby
3. Choices must have meaningful consequences
4. Death is possible but should result from clear player decisions
5. Include opportunities to find items that help with escape or survival

Victory Conditions:
- Escape: Find key items and reach a safe location
- Confrontation: With the right weapons and preparation, face The Stalker
- Each ending should feel earned through player choices

For each response, provide:
1. A vivid story segment (2-3 paragraphs) with:
   - Rich sensory details
   - Clear signs of danger
   - Environmental storytelling
2. Exactly three distinct choices that:
   - Lead to different outcomes
   - Include risk vs. reward decisions
   - Consider the player's current items and situation

Format your response as valid JSON:
{
  "story": "your horror story text here",
  "choices": ["choice 1", "choice 2", "choice 3"],
  "gameState": {
    "hasWeapon": boolean,
    "hasKey": boolean,
    "tension": number,
    "encounterCount": number
  }
}`;

async function generateStoryResponse(messages: ChatMessage[], currentGameState: GameState = INITIAL_GAME_STATE) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: SYSTEM_PROMPT
      },
      {
        role: 'system',
        content: `Current game state: ${JSON.stringify(currentGameState)}`
      },
      ...messages
    ],
    temperature: 0.8,
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
    const { messages, gameState } = await req.json() as { 
      messages: ChatMessage[];
      gameState?: GameState;
    };

    if (!messages) {
      return Response.json(
        { error: 'No messages provided' },
        { status: 400 }
      );
    }

    const response = await generateStoryResponse(messages, gameState || INITIAL_GAME_STATE);
    return Response.json(JSON.parse(response));
    
  } catch (err) {
    console.error('Error generating story:', err);
    return Response.json(
      { 
        error: err instanceof Error ? err.message : 'An error occurred',
        fallback: {
          story: "The Stalker's shadow looms closer... Perhaps we should try a different path?",
          choices: ["Run and hide", "Look for another way", "Face your fate"],
          gameState: INITIAL_GAME_STATE
        }
      },
      { status: 500 }
    );
  }
}