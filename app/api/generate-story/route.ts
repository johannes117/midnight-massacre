import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { NextRequest } from 'next/server';
import { GameState, Choice, StoryResponse } from '@/lib/types';
import { SYSTEM_PROMPT } from '@/lib/game-prompts';
import { GameMechanics } from '@/lib/game-mechanics';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define the Message type
interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// Validate the OpenAI response structure
function isValidStoryResponse(response: unknown): response is StoryResponse {
  const typedResponse = response as StoryResponse;
  return (
    typeof response === 'object' &&
    response !== null &&
    typeof typedResponse.story === 'string' &&
    Array.isArray(typedResponse.choices) &&
    typedResponse.choices.length > 0 &&
    typedResponse.choices.every((choice: Choice) => 
      typeof choice.text === 'string' &&
      typeof choice.dc === 'number' &&
      typeof choice.riskFactor === 'number' &&
      typeof choice.rewardValue === 'number' &&
      typeof choice.type === 'string'
    ) &&
    typeof typedResponse.gameState === 'object'
  );
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
      messages: Message[];
      gameState: GameState;
    };

    const gameStatePrompt = `Current game state (USE THIS TO INFORM YOUR CHOICES):
- Turn: ${gameState.progress.currentTurn}/${gameState.progress.totalTurns} (${gameState.progress.timeOfNight})
- Survival Score: ${gameState.survivalScore}${gameState.survivalScore < 50 ? ' (CRITICAL!)' : ''}
- Stalker Presence: ${gameState.stalkerPresence}
- Status Effects: ${gameState.statusEffects?.join(', ') || 'none'}
- Items: ${[
    gameState.hasWeapon && 'weapon',
    gameState.hasKey && 'key'
  ].filter(Boolean).join(', ') || 'none'}
- Tension: ${gameState.tension}/10
- Encounters: ${gameState.encounterCount}`;

    const systemInstructions = `${SYSTEM_PROMPT}\n\nIMPORTANT: You must respond with valid JSON in the following format: { "story": string, "choices": Choice[], "gameState": GameState }`;

    const apiMessages: ChatCompletionMessageParam[] = [
      { role: 'system', content: systemInstructions },
      { role: 'system', content: gameStatePrompt },
      ...messages
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: apiMessages,
      temperature: 0.8,
      response_format: { type: "json_object" }
    });

    let response: StoryResponse;
    try {
      const content = completion.choices[0]?.message?.content || '{}';
      const parsedResponse = JSON.parse(content);

      if (!isValidStoryResponse(parsedResponse)) {
        throw new Error('Invalid response structure');
      }

      response = parsedResponse;

      // Update game state while preserving progression
      response.gameState = {
        ...gameState,
        ...response.gameState,
        survivalScore: gameState.survivalScore,
        tension: Math.min(10, gameState.tension),
        progress: {
          currentTurn: gameState.progress.currentTurn,
          totalTurns: gameState.progress.totalTurns,
          timeOfNight: GameMechanics.getTimeOfNight(gameState.progress.currentTurn)
        }
      };

    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      throw new Error('Failed to parse AI response');
    }

    return Response.json(response);
  } catch (error) {
    console.error('Error generating story:', error);
    // Return a fallback response that matches our schema
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'An error occurred',
        fallback: {
          story: "The shadows grow longer... Something has gone wrong, but you must keep moving.",
          choices: [
            {
              text: "Hide in the nearest room",
              dc: 7,
              riskFactor: -10,
              rewardValue: 10,
              type: "stealth",
              logic: "Basic stealth option with moderate risk/reward"
            }
          ],
          gameState: GameMechanics.getInitialGameState()
        }
      },
      { status: 500 }
    );
  }
}