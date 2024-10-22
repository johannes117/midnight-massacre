// /app/api/generate-story/route.ts
import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { NextRequest } from 'next/server';
import { GameMechanics } from '@/lib/game-mechanics';
import type { GameState, Choice, StoryResponse, Message } from '@/lib/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are crafting an interactive horror story with specific mechanics. For each response, provide:

1. A vivid story segment (2-3 paragraphs) that:
   - Builds tension through environmental details
   - Includes sensory information
   - Reflects the current stalker presence level
   - Acknowledges player's previous choices and current status

2. Exactly three choices, each with:
   - Difficulty Class (DC): 1-20 (higher for riskier actions)
   - Risk Factor: -5 to -30 (survival points lost on failure)
   - Reward Value: +5 to +20 (survival points gained on success)
   - Action Type: combat, stealth, escape, or search
   
Consider the current game state:
- Survival Score (player dies at 0)
- Stalker Presence (distant, hunting, closingIn, imminent)
- Status Effects (injured, hidden, exposed)
- Items (weapon, key)

Adjust difficulty and stakes based on:
- If survival score is low (<50), provide some lower-risk options
- If stalker presence is high, increase stakes and urgency
- If player has items, offer relevant tactical options
- If status effects are active, reflect them in choices`;

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

    const gameStatePrompt = `
Current game state:
- Survival Score: ${gameState.survivalScore}
- Stalker Presence: ${gameState.stalkerPresence}
- Status Effects: ${gameState.statusEffects.join(', ') || 'none'}
- Items: ${[
    gameState.hasWeapon && 'weapon',
    gameState.hasKey && 'key'
  ].filter(Boolean).join(', ') || 'none'}
- Tension: ${gameState.tension}/10
- Encounters: ${gameState.encounterCount}`;

    // Convert messages to ChatCompletionMessageParam format
    const apiMessages: ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'system', content: gameStatePrompt },
      ...messages.map(msg => ({
        role: msg.role as 'system' | 'user' | 'assistant',
        content: msg.content
      }))
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: apiMessages,
      temperature: 0.8,
      response_format: { type: "json_object" },
    });

    const response: StoryResponse = JSON.parse(completion.choices[0]?.message?.content || '');

    response.choices = validateChoices(response.choices);
    response.choices = response.choices.map(choice => 
      adjustChoiceDifficulty(choice, gameState)
    );

    response.gameState = {
      ...gameState,
      ...response.gameState,
      survivalScore: gameState.survivalScore,
      tension: Math.min(10, gameState.tension)
    };

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