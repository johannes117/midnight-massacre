import { Choice, GameState } from "./types";

// lib/game-mechanics.ts

export class GameMechanics {
  private static readonly MAX_SURVIVAL_SCORE = 150;
  private static readonly CRITICAL_THRESHOLD = 50;
  private static readonly DEATH_THRESHOLD = 0;

  static checkGameOver(gameState?: GameState): { isOver: boolean; ending: string } {
    if (!gameState) {
      return { isOver: false, ending: '' };
    }

    if (gameState.survivalScore <= this.DEATH_THRESHOLD) {
      return { isOver: true, ending: 'death' };
    }
    
    if (gameState.stalkerPresence === 'imminent' && !gameState.hasWeapon) {
      return { isOver: true, ending: 'caught' };
    }

    const hasEscapeConditions = gameState.hasKey && gameState.survivalScore >= 80 && gameState.encounterCount >= 6;
    const hasVictoryConditions = gameState.hasWeapon && gameState.survivalScore >= 100 && gameState.encounterCount >= 8;

    if (hasEscapeConditions || hasVictoryConditions) {
      return { isOver: true, ending: 'victory' };
    }

    return { isOver: false, ending: '' };
  }

  static calculateEnvironmentalModifiers(gameState: GameState): number {
    const { darkness, noise, weather } = gameState.environmentalModifiers;
    const totalModifier = Math.min(5, darkness + noise + weather);
    return totalModifier;
  }

  static calculateStatusModifiers(gameState: GameState, actionType: Choice['type']): number {
    let modifier = 0;
    if (gameState.statusEffects.includes('injured')) {
      modifier -= 1;
    }
    if (gameState.statusEffects.includes('hidden') && actionType === 'stealth') {
      modifier += 1;
    }
    if (gameState.statusEffects.includes('exposed')) {
      modifier -= 1;
    }
    modifier = Math.max(-2, Math.min(2, modifier));
    return modifier;
  }

  static calculateStalkerModifier(stalkerPresence: GameState['stalkerPresence']): number {
    const modifiers = {
      distant: 0,
      hunting: -1,
      closingIn: -1,
      imminent: -2
    };
    const modifier = modifiers[stalkerPresence];
    return modifier;
  }

  static resolveAction(
    choice: Choice,
    gameState: GameState
  ): { success: boolean; newGameState: GameState; outcomeText: string } {
    const roll = this.rollD20();
    const success = roll >= choice.dc;

    const survivalDelta = success ? choice.rewardValue : -choice.riskFactor;
    const newSurvivalScore = Math.min(
      this.MAX_SURVIVAL_SCORE,
      Math.max(this.DEATH_THRESHOLD, gameState.survivalScore + survivalDelta)
    );

    const newGameState = {
      ...gameState,
      survivalScore: newSurvivalScore,
      tension: Math.min(10, gameState.tension + (success ? -1 : 1)),
      encounterCount: gameState.encounterCount + (choice.type === 'combat' ? 1 : 0)
    };

    if (!success || newGameState.tension >= 8) {
      const progressions: Record<GameState['stalkerPresence'], GameState['stalkerPresence']> = {
        distant: 'hunting',
        hunting: 'closingIn',
        closingIn: 'imminent',
        imminent: 'imminent'
      };
      newGameState.stalkerPresence = progressions[gameState.stalkerPresence];
    }

    const outcomeText = this.generateOutcomeText(success, roll, choice.dc);

    return { success, newGameState, outcomeText };
  }

  private static generateOutcomeText(
    success: boolean,
    roll: number,
    dc: number
  ): string {
    const result = success ? 'Success!' : 'Failure!';
    return `${result} (Rolled ${roll}, needed ${dc})`;
  }

  private static rollD20(): number {
    return Math.floor(Math.random() * 20) + 1;
  }
}

export const INITIAL_GAME_STATE: GameState = {
  survivalScore: 100,
  hasWeapon: false,
  hasKey: false,
  tension: 0,
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
};
