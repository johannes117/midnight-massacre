// /app/api/generate-story/route.ts
import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { NextRequest } from 'next/server';
import { GameMechanics } from '@/lib/game-mechanics';
import type { GameState, Choice, StoryResponse, Message } from '@/lib/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are crafting an interactive horror story with specific mechanics. RESPOND ONLY WITH VALID JSON in the following format:
{
  "story": "Your vivid story text here...",
  "choices": [
    {
      "text": "Choice description",
      "dc": number between 1-20,
      "riskFactor": number between -30 and -5,
      "rewardValue": number between 5 and 20,
      "type": "combat" OR "stealth" OR "escape" OR "search",
      "logic": "Explanation of choice mechanics"
    }
  ],
  "gameState": {
    "survivalScore": number,
    "hasWeapon": boolean,
    "hasKey": boolean,
    "tension": number,
    "encounterCount": number,
    "stalkerPresence": "distant" OR "hunting" OR "closingIn" OR "imminent",
    "statusEffects": string[],
    "environmentalModifiers": {
      "darkness": number,
      "noise": number,
      "weather": number
    }
  }
}

Story requirements:
1. Write 2-3 vivid paragraphs that:
   - Build tension through environmental details
   - Include sensory information
   - Reflect the current stalker presence level
   - Acknowledge player's previous choices and status

Choice requirements:
1. Provide EXACTLY three choices
2. Adjust difficulty based on:
   - Low survival score (<50): offer lower-risk options
   - High stalker presence: increase stakes and urgency
   - Available items: provide tactical options
   - Active status effects: reflect in choices`;

function adjustChoiceDifficulty(choice: Choice, gameState: GameState): Choice {
  let adjustedDC = choice.dc;
  
  adjustedDC += GameMechanics.calculateEnvironmentalModifiers(gameState);
  adjustedDC += GameMechanics.calculateStatusModifiers(gameState, choice.type);
  adjustedDC += GameMechanics.calculateStalkerModifier(gameState.stalkerPresence);
  adjustedDC += Math.floor(gameState.encounterCount / 3);

  if (gameState.survivalScore < 50) {
    adjustedDC -= 2;
  }

  return {
    ...choice,
    dc: Math.min(20, Math.max(1, adjustedDC))
  };
}

function validateChoices(choices: Choice[]): Choice[] {
  return choices.map(choice => ({
    ...choice,
    dc: Math.min(20, Math.max(1, choice.dc)),
    riskFactor: Math.min(-5, Math.max(-30, choice.riskFactor)),
    rewardValue: Math.min(20, Math.max(5, choice.rewardValue)),
    type: ['combat', 'stealth', 'escape', 'search'].includes(choice.type) ? 
      choice.type : 'search'
  }));
}

function generateFallbackResponse(): StoryResponse {
  return {
    story: "The shadows grow longer as The Stalker's presence looms... Something has gone wrong, but you must keep moving.",
    choices: [
      {
        text: "Hide in the nearest room",
        dc: 12,
        riskFactor: -10,
        rewardValue: 15,
        type: 'stealth',
        logic: "Basic stealth option with moderate risk/reward"
      },
      {
        text: "Make a run for it",
        dc: 14,
        riskFactor: -20,
        rewardValue: 20,
        type: 'escape',
        logic: "High-risk escape attempt"
      },
      {
        text: "Search for anything useful",
        dc: 10,
        riskFactor: -5,
        rewardValue: 10,
        type: 'search',
        logic: "Low-risk search option"
      }
    ],
    gameState: {
      survivalScore: 100,
      hasWeapon: false,
      hasKey: false,
      tension: 5,
      encounterCount: 0,
      stalkerPresence: 'distant',
      statusEffects: [],
      environmentalModifiers: {
        darkness: 0,
        noise: 0,
        weather: 0
      }
    }
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

    const gameStatePrompt = `Current game state (INCLUDE THIS INFORMATION IN YOUR RESPONSE JSON):
- Survival Score: ${gameState.survivalScore}
- Stalker Presence: ${gameState.stalkerPresence}
- Status Effects: ${gameState.statusEffects.join(', ') || 'none'}
- Items: ${[
    gameState.hasWeapon && 'weapon',
    gameState.hasKey && 'key'
  ].filter(Boolean).join(', ') || 'none'}
- Tension: ${gameState.tension}/10
- Encounters: ${gameState.encounterCount}`;

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

      // Validate response structure
      if (!response.story || !Array.isArray(response.choices) || !response.gameState) {
        throw new Error('Invalid response structure');
      }

      // Validate and adjust choices
      if (response.choices.length !== 3) {
        throw new Error('Invalid number of choices');
      }

      response.choices = validateChoices(response.choices);
      response.choices = response.choices.map(choice => 
        adjustChoiceDifficulty(choice, gameState)
      );

      // Ensure game state consistency
      response.gameState = {
        ...gameState,
        ...response.gameState,
        survivalScore: gameState.survivalScore,
        tension: Math.min(10, gameState.tension)
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