import { StreamingTextResponse } from 'ai';
import OpenAI from 'openai';
import type { GameState } from '@/lib/types';
import { SYSTEM_PROMPT } from '@/lib/game-prompts';
import { GameMechanics } from '@/lib/game-mechanics';
import { z } from 'zod';

export const runtime = 'edge';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Define the response schema using Zod
const choiceSchema = z.object({
  text: z.string(),
  dc: z.number(),
  riskFactor: z.number(),
  rewardValue: z.number(),
  type: z.string(),
  logic: z.string().optional(),
  requirements: z.object({
    item: z.string().nullable().optional(),
    minSurvival: z.number().optional(),
    status: z.array(z.string()).optional()
  }).optional()
});

const storyResponseSchema = z.object({
  story: z.string(),
  choices: z.array(choiceSchema),
  gameState: z.object({
    survivalScore: z.number(),
    tension: z.number(),
    stalkerPresence: z.string(),
    statusEffects: z.array(z.string()),
    hasWeapon: z.boolean(),
    hasKey: z.boolean(),
    encounterCount: z.number(),
    failedRollsCount: z.number(),
    progress: z.object({
      currentTurn: z.number(),
      totalTurns: z.number(),
      timeOfNight: z.string()
    })
  })
});

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'OpenAI API key not configured' }),
      { status: 500 }
    );
  }

  try {
    const { messages, gameState } = await req.json() as {
      messages: { role: string; content: string }[];
      gameState: GameState;
    };

    const systemPrompt = `${SYSTEM_PROMPT}\n\nIMPORTANT: You must respond with a valid JSON object that includes 'story', 'choices', and 'gameState' fields.`;

    const gameStatePrompt = `Current game state:
- Turn: ${gameState.progress.currentTurn}/${gameState.progress.totalTurns} (${gameState.progress.timeOfNight})
- Survival Score: ${gameState.survivalScore}
- Stalker Presence: ${gameState.stalkerPresence}
- Status Effects: ${gameState.statusEffects?.join(', ') || 'none'}
- Items: ${[gameState.hasWeapon && 'weapon', gameState.hasKey && 'key'].filter(Boolean).join(', ') || 'none'}
- Tension: ${gameState.tension}/10`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'system', content: gameStatePrompt },
        ...messages.map(msg => ({
          role: msg.role as 'system' | 'user' | 'assistant',
          content: msg.content
        }))
      ],
      stream: true,
      response_format: { type: "json_object" },
      temperature: 0.8,
      max_tokens: 1000,
    });

    // Transform the completion stream into a readable stream
    const stream = new ReadableStream({
      async start(controller) {
        let buffer = '';
        
        try {
          for await (const chunk of response) {
            const content = chunk.choices[0]?.delta?.content || '';
            buffer += content;
            
            try {
              // Try to parse complete JSON objects from the buffer
              const parsedData = JSON.parse(buffer);
              
              // Validate against schema
              const validatedData = storyResponseSchema.parse(parsedData);
              
              // Update game state
              validatedData.gameState = {
                ...gameState,
                ...validatedData.gameState,
                survivalScore: gameState.survivalScore,
                tension: Math.min(10, gameState.tension),
                progress: {
                  currentTurn: gameState.progress.currentTurn,
                  totalTurns: gameState.progress.totalTurns,
                  timeOfNight: GameMechanics.getTimeOfNight(gameState.progress.currentTurn)
                }
              };
              
              // Send the validated and updated data
              controller.enqueue(
                new TextEncoder().encode(JSON.stringify(validatedData) + '\n')
              );
              
              // Clear buffer after successful parse
              buffer = '';
            } catch {
              // If parsing fails, continue accumulating the buffer
              continue;
            }
          }
          
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new StreamingTextResponse(stream);
    
  } catch (error) {
    console.error('Error in story generation:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'An error occurred',
        fallback: {
          story: "The shadows grow longer... Something has gone wrong, but you must keep moving.",
          choices: [{
            text: "Hide in the nearest room",
            dc: 7,
            riskFactor: -10,
            rewardValue: 10,
            type: "stealth"
          }],
          gameState: GameMechanics.getInitialGameState()
        }
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}