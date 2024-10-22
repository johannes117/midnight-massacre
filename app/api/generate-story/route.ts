// /app/api/generate-story/route.ts
import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { NextRequest } from 'next/server';
import type { GameState, Choice, StoryResponse, Message } from '@/lib/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are crafting an interactive horror story in the style of classic 80s slasher films. Think Halloween, Friday the 13th, and A Nightmare on Elm Street. The Stalker should be an unstoppable, almost supernatural force like Michael Myers - silent, relentless, and terrifying.

Setting: A small, isolated town on Halloween night. Think vintage Americana - abandoned high schools, dimly lit streets, foggy woods, creaky houses, and classic Halloween decorations. The atmosphere should be thick with dread and nostalgia.

The player starts with three friends:
1. Alex: The best friend, loyal and level-headed.
2. Jamie: The tech whiz, always has the latest gadgets.
3. Casey: The athlete, quick reflexes and protective.

DIFFICULTY CHECK (DC) AND REWARD SYSTEM:
When creating choices, assign DCs and rewards based on these guidelines:

EASY (DC 5-8): Safe actions with low risk
- DC: 5-8
- Risk Factor: -5 to -10
- Reward Value: 5-10
Examples:
- Hiding in obvious, secure locations
- Basic searching in safe areas
- Using clearly marked paths
- Interacting with trusted companions

MEDIUM (DC 9-12): Moderate risk actions
- DC: 9-12
- Risk Factor: -10 to -15
- Reward Value: 10-15
Examples:
- Sneaking past distant threats
- Searching uncertain areas
- Basic investigation
- Climbing through windows
- Quick dashes between cover

HARD (DC 13-16): Risky actions
- DC: 13-16
- Risk Factor: -15 to -20
- Reward Value: 15-20
Examples:
- Confrontations with the Stalker
- Moving through exposed areas
- Complex athletics (climbing drainpipes)
- Fighting regular enemies
- Precise timing challenges

DEADLY (DC 17-20): Extremely dangerous actions
- DC: 17-20
- Risk Factor: -20 to -30
- Reward Value: 20-25
Examples:
- Direct combat with the Stalker
- Very exposed movements
- Desperate measures
- Nearly impossible feats

Consider these factors when setting DCs:
1. Is the action risky? (+3-5 to DC)
2. Is the player exposed? (+2-4 to DC)
3. Does the player have an advantage? (-2-4 from DC)
4. Current stalker presence level (higher = harder)

Theme requirements:
1. Use classic slasher tropes and locations creatively
2. Include subtle references to iconic horror movies
3. Maintain a suspenseful, creepy atmosphere
4. Describe environmental details that evoke 80s nostalgia
5. Build tension through sound, shadows, and glimpses of The Stalker
6. Use weather and lighting to enhance the horror (fog, thunder, flickering lights)
7. Start with a fun, lighthearted scene (e.g., game night) and slowly introduce danger
8. Allow player to interact with their friends through choices
9. Friends can be killed off by the Stalker as the story progresses

RESPOND ONLY WITH VALID JSON in the following format:
{
  "story": "Your vivid story text here...",
  "choices": [
    {
      "text": "Choice description",
      "dc": number based on difficulty guidelines above,
      "riskFactor": matching risk factor based on DC,
      "rewardValue": matching reward value based on DC,
      "type": "combat" OR "stealth" OR "escape" OR "search" OR "interact",
      "logic": "Explanation of choice mechanics and why you chose this DC"
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
    },
    "companions": [
      {
        "name": string,
        "status": "alive" OR "injured" OR "dead"
      }
    ]
  }
}`;

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
      },
      companions: [
        { name: 'Alex', status: 'alive' },
        { name: 'Jamie', status: 'alive' },
        { name: 'Casey', status: 'alive' }
      ]
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

    const gameStatePrompt = `Current game state (USE THIS TO INFORM YOUR CHOICE DIFFICULTY):
- Survival Score: ${gameState.survivalScore}${gameState.survivalScore < 50 ? ' (CRITICAL!)' : ''}
- Stalker Presence: ${gameState.stalkerPresence}
- Status Effects: ${gameState.statusEffects.join(', ') || 'none'}
- Items: ${[
    gameState.hasWeapon && 'weapon',
    gameState.hasKey && 'key'
  ].filter(Boolean).join(', ') || 'none'}
- Tension: ${gameState.tension}/10
- Encounters: ${gameState.encounterCount}

Consider these conditions when setting DCs and risk factors. Remember:
- Low survival score should encourage including some safer options
- Higher stalker presence should increase DCs
- Status effects should influence available choices
- Equipment should unlock new possibilities
- Always match risk factors and reward values to the DC level using the guidelines above`;

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

      // Update game state while preserving current values
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