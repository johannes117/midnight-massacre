import { Choice, GameState } from "./types";

// game-mechanics.ts
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
      weather: 0,
    }
  };
  
  export class GameMechanics {
    private static readonly MAX_SURVIVAL_SCORE = 150;
    private static readonly CRITICAL_THRESHOLD = 50;
    private static readonly DEATH_THRESHOLD = 0;
  
    static rollD20(): number {
      return Math.floor(Math.random() * 20) + 1;
    }
  
    static calculateEnvironmentalModifiers(gameState: GameState): number {
      const { darkness, noise, weather } = gameState.environmentalModifiers;
      return darkness + noise + weather;
    }
  
    static calculateStatusModifiers(gameState: GameState, actionType: Choice['type']): number {
      let modifier = 0;
  
      if (gameState.statusEffects.includes('injured')) modifier += 3;
      if (gameState.statusEffects.includes('hidden') && actionType === 'stealth') modifier -= 2;
      if (gameState.statusEffects.includes('exposed')) modifier += 4;
      if (gameState.hasWeapon && actionType === 'combat') modifier -= 2;
  
      return modifier;
    }
  
    static calculateStalkerModifier(stalkerPresence: GameState['stalkerPresence']): number {
      const modifiers = {
        distant: 0,
        hunting: 2,
        closingIn: 4,
        imminent: 6
      };
      return modifiers[stalkerPresence];
    }
  
    static resolveAction(
      choice: Choice,
      gameState: GameState
    ): { success: boolean; newGameState: GameState; outcomeText: string } {
      const roll = this.rollD20();
      const environmentalMod = this.calculateEnvironmentalModifiers(gameState);
      const statusMod = this.calculateStatusModifiers(gameState, choice.type);
      const stalkerMod = this.calculateStalkerModifier(gameState.stalkerPresence);
      
      const totalRoll = roll - environmentalMod - statusMod - stalkerMod;
      const success = totalRoll >= choice.dc;
  
      // Calculate new survival score
      const survivalDelta = success ? choice.rewardValue : -choice.riskFactor;
      const newSurvivalScore = Math.min(
        this.MAX_SURVIVAL_SCORE,
        Math.max(this.DEATH_THRESHOLD, gameState.survivalScore + survivalDelta)
      );
  
      // Update game state
      const newGameState = {
        ...gameState,
        survivalScore: newSurvivalScore,
        tension: Math.min(10, gameState.tension + (success ? -1 : 1)),
        encounterCount: gameState.encounterCount + (choice.type === 'combat' ? 1 : 0)
      };
  
      // Progress stalker presence on failures or high tension
      if (!success || newGameState.tension >= 8) {
        const progressions: Record<GameState['stalkerPresence'], GameState['stalkerPresence']> = {
          distant: 'hunting',
          hunting: 'closingIn',
          closingIn: 'imminent',
          imminent: 'imminent'
        };
        newGameState.stalkerPresence = progressions[gameState.stalkerPresence];
      }
  
      // Generate outcome text
      const outcomeText = this.generateOutcomeText(success, roll, choice, totalRoll, choice.dc);
  
      return { success, newGameState, outcomeText };
    }
  
    private static generateOutcomeText(
      success: boolean,
      roll: number,
      choice: Choice,
      totalRoll: number,
      dc: number
    ): string {
      const margin = Math.abs(totalRoll - dc);
      let quality = '';
      
      if (success) {
        if (margin >= 10) quality = 'Critical Success!';
        else if (margin >= 5) quality = 'Great Success!';
        else quality = 'Success!';
      } else {
        if (margin >= 10) quality = 'Critical Failure!';
        else if (margin >= 5) quality = 'Major Failure!';
        else quality = 'Failure!';
      }
  
      return `${quality} (Rolled ${roll}, needed ${dc})`;
    }
  
    static checkGameOver(gameState: GameState): { isOver: boolean; ending: string } {
      if (gameState.survivalScore <= this.DEATH_THRESHOLD) {
        return { isOver: true, ending: 'death' };
      }
      
      if (gameState.stalkerPresence === 'imminent' && !gameState.hasWeapon) {
        return { isOver: true, ending: 'caught' };
      }
  
      const hasEscapeConditions = gameState.hasKey && gameState.survivalScore >= 75;
      const hasVictoryConditions = gameState.hasWeapon && gameState.survivalScore >= 100;
  
      if (hasEscapeConditions || hasVictoryConditions) {
        return { isOver: true, ending: 'victory' };
      }
  
      return { isOver: false, ending: '' };
    }
  }