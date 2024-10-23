// /app/api/generate-story/route.ts
import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { NextRequest } from 'next/server';
import { GameState, Choice } from '@/lib/types';
import { SYSTEM_PROMPT } from '@/lib/game-prompts';
import { GameMechanics } from '@/lib/game-mechanics';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface StoryResponse {
  story: string;
  choices: Choice[];
  gameState: GameState;
}

function validateChoices(choices: Choice[]): Choice[] {
  return choices.map(choice => ({
    ...choice,
    dc: Math.min(20, Math.max(1, choice.dc)),
    riskFactor: Math.min(-5, Math.max(-30, choice.riskFactor)),
    rewardValue: Math.min(25, Math.max(5, choice.rewardValue)),
    type: ['combat', 'stealth', 'escape', 'search', 'interact'].includes(choice.type) ? 
      choice.type : 'search'
  }));
}

function generateFallbackResponse(): StoryResponse {
  const initialState = GameMechanics.getInitialGameState();
  return {
    story: "The shadows grow longer as The Stalker's presence looms... Something has gone wrong, but you must keep moving.",
    choices: [
      {
        text: "Hide in the nearest room",
        dc: 7,
        riskFactor: -10,
        rewardValue: 10,
        type: 'stealth',
        logic: "Basic stealth option with moderate risk/reward"
      },
      {
        text: "Make a run for it",
        dc: 14,
        riskFactor: -20,
        rewardValue: 15,
        type: 'escape',
        logic: "High-risk escape attempt"
      },
      {
        text: "Search for anything useful",
        dc: 8,
        riskFactor: -5,
        rewardValue: 8,
        type: 'search',
        logic: "Low-risk search option"
      }
    ],
    gameState: initialState
  };
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
- Status Effects: ${gameState.statusEffects.join(', ') || 'none'}
- Items: ${[
    gameState.hasWeapon && 'weapon',
    gameState.hasKey && 'key'
  ].filter(Boolean).join(', ') || 'none'}
- Tension: ${gameState.tension}/10
- Encounters: ${gameState.encounterCount}

Time of Night Guidelines:
${gameState.progress.timeOfNight === 'dusk' ? '- Early game: Focus on exploration and building tension' :
  gameState.progress.timeOfNight === 'midnight' ? '- Mid game: Increase danger and encounters' :
  gameState.progress.timeOfNight === 'lateNight' ? '- Late game: Peak danger and difficult choices' :
  gameState.progress.timeOfNight === 'nearDawn' ? '- Near end: Push towards final confrontation' :
  '- Dawn: Final moments of survival'}

Consider these conditions when setting DCs and risk factors. Remember:
- Low survival score should encourage including some safer options
- Higher stalker presence should increase DCs
- Status effects should influence available choices
- Equipment should unlock new possibilities
- Always match risk factors and reward values to the DC level`;

    const apiMessages: ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'system', content: gameStatePrompt },
      ...messages.map(msg => ({
        role: msg.role as 'system' | 'user' | 'assistant',
        content: msg.content
      }))
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: apiMessages,
      temperature: 0.8,
    });

    let response: StoryResponse;
    try {
      const content = completion.choices[0]?.message?.content || '{}';
      response = JSON.parse(content);

      if (!response.story || !Array.isArray(response.choices) || !response.gameState) {
        throw new Error('Invalid response structure');
      }

      if (response.choices.length !== 3) {
        throw new Error('Invalid number of choices');
      }

      // Validate and adjust choices
      response.choices = validateChoices(response.choices);

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
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'An error occurred',
        fallback: generateFallbackResponse()
      },
      { status: 500 }
    );
  }
}
