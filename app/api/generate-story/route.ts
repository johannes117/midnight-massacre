// /app/api/generate-story/route.ts
import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { NextRequest } from 'next/server';
import { GameMechanics } from '@/lib/game-mechanics';
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
      "dc": number between 1-20,
      "riskFactor": number between -30 and -5,
      "rewardValue": number between 5 and 20,
      "type": "combat" OR "stealth" OR "escape" OR "search" OR "interact",
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
    },
    "companions": [
      {
        "name": string,
        "status": "alive" OR "injured" OR "dead"
      }
    ]
  }
}

Story requirements:
1. Write 2-3 vivid paragraphs that:
   - Build tension through environmental details (crackling leaves, distant screams, Halloween decorations moving in the wind)
   - Include rich sensory information (focusing on sound and limited visibility)
   - Reflect the current stalker presence level through environmental cues:
     * distant: subtle hints (shadowy movement, faint footsteps)
     * hunting: growing dread (knockings, doors closing)
     * closingIn: immediate danger (heavy breathing, closer footsteps)
     * imminent: face to face confrontation
   - Acknowledge player's previous choices and status
   - Incorporate classic slasher movie elements and settings
   - Include interactions with or status updates about the player's companions

Choice requirements:
1. Provide EXACTLY three choices that feel authentic to the genre:
   - Combat should involve improvised weapons and desperate situations
   - Stealth should utilize classic hiding spots (closets, under beds, behind curtains)
   - Escape should involve tense chase scenarios
   - Search should discover both useful items and disturbing scenes
   - Interact should allow communication or cooperation with companions
2. Adjust difficulty based on:
   - Low survival score (<50): offer lower-risk options
   - High stalker presence: increase stakes and urgency
   - Available items: provide tactical options
   - Active status effects: reflect in choices
   - Companion status: offer choices to help or be helped by companions
3. Each choice should feel like a decision a horror movie character would make`;


function adjustChoiceDifficulty(choice: Choice, gameState: GameState): Choice {
  let adjustedDC = choice.dc;
  
  let totalModifier = 0;
  
  const environmentalMod = GameMechanics.calculateEnvironmentalModifiers(gameState);
  const statusMod = GameMechanics.calculateStatusModifiers(gameState, choice.type);
  const stalkerMod = GameMechanics.calculateStalkerModifier(gameState.stalkerPresence);
  const encounterMod = Math.min(2, Math.floor(gameState.encounterCount / 3));

  totalModifier += environmentalMod;
  totalModifier += statusMod;
  totalModifier += stalkerMod;
  totalModifier += encounterMod;

  if (gameState.survivalScore < 50) {
    totalModifier += 1; // Make it slightly easier when survival score is low
  }

  // Cap the total modifier
  totalModifier = Math.max(-5, Math.min(5, totalModifier));

  // Adjust the DC based on the total modifier
  adjustedDC = Math.max(1, Math.min(20, adjustedDC - totalModifier));

  console.log(`Choice Difficulty Adjustment:
    Original DC: ${choice.dc}
    Environmental Modifier: ${environmentalMod}
    Status Modifier: ${statusMod}
    Stalker Modifier: ${stalkerMod}
    Encounter Modifier: ${encounterMod}
    Low Survival Score Modifier: ${gameState.survivalScore < 50 ? 1 : 0}
    Total Modifier: ${totalModifier}
    Adjusted DC: ${adjustedDC}
  `);

  return {
    ...choice,
    dc: adjustedDC
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
