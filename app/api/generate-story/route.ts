import { OpenAIStream, StreamingTextResponse } from 'ai';
import OpenAI from 'openai';
import { GameState, Choice, StoryResponse } from '@/lib/types';
import { SYSTEM_PROMPT } from '@/lib/game-prompts';
import { GameMechanics } from '@/lib/game-mechanics';

export const runtime = 'edge';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

function isValidStoryResponse(response: unknown): response is StoryResponse {
  const typedResponse = response as Partial<StoryResponse>;
  return (
    typeof response === 'object' &&
    response !== null &&
    typeof typedResponse.story === 'string' &&
    Array.isArray(typedResponse.choices) &&
    typedResponse.choices?.length > 0 &&
    typedResponse.choices.every((choice: Partial<Choice>) => 
      typeof choice.text === 'string' &&
      typeof choice.dc === 'number' &&
      typeof choice.riskFactor === 'number' &&
      typeof choice.rewardValue === 'number' &&
      typeof choice.type === 'string'
    ) &&
    typedResponse.gameState !== undefined
  );
}

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

    const systemPrompt = `${SYSTEM_PROMPT}\n\nIMPORTANT: You must respond with a valid JSON object that includes 'story', 'choices', and 'gameState' fields. Your entire response must be parseable JSON.`;

    const gameStatePrompt = `Current game state (use this to generate JSON response):
- Turn: ${gameState.progress.currentTurn}/${gameState.progress.totalTurns} (${gameState.progress.timeOfNight})
- Survival Score: ${gameState.survivalScore}${gameState.survivalScore < 50 ? ' (CRITICAL!)' : ''}
- Stalker Presence: ${gameState.stalkerPresence}
- Status Effects: ${gameState.statusEffects?.join(', ') || 'none'}
- Items: ${[gameState.hasWeapon && 'weapon', gameState.hasKey && 'key'].filter(Boolean).join(', ') || 'none'}
- Tension: ${gameState.tension}/10
- Encounters: ${gameState.encounterCount}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
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

    let buffer = '';

    const stream = OpenAIStream(response, {
      onToken: (token) => {
        buffer += token;
      },
      async onCompletion() {
        try {
          const parsedResponse = JSON.parse(buffer);
          if (isValidStoryResponse(parsedResponse)) {
            parsedResponse.gameState = {
              ...gameState,
              ...parsedResponse.gameState,
              survivalScore: gameState.survivalScore,
              tension: Math.min(10, gameState.tension),
              progress: {
                currentTurn: gameState.progress.currentTurn,
                totalTurns: gameState.progress.totalTurns,
                timeOfNight: GameMechanics.getTimeOfNight(gameState.progress.currentTurn)
              }
            };
            buffer = JSON.stringify(parsedResponse);
          }
        } catch (error) {
          console.error('Error processing response:', error);
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
            type: "stealth",
            logic: "Basic stealth option with moderate risk/reward"
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