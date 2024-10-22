import { Choice, GameState, GameOverState } from "./types";

export class GameMechanics {
  private static readonly MAX_SURVIVAL_SCORE = 150;
  private static readonly MIN_SURVIVAL_SCORE = 0;

  // Base DC ranges for different risk levels
  private static readonly DC_RANGES = {
    EASY: { min: 5, max: 8 },    // Safe actions (hiding in obvious spots, basic searching)
    MEDIUM: { min: 9, max: 12 },  // Moderate risk (sneaking past at a distance, investigating)
    HARD: { min: 13, max: 16 },   // Risky actions (confrontations, exposed movement)
    DEADLY: { min: 17, max: 20 }  // Extremely dangerous (direct combat, desperate moves)
  };

  static checkGameOver(gameState: GameState): GameOverState {
    // Death by low survival score
    if (gameState.survivalScore <= this.MIN_SURVIVAL_SCORE) {
      return { isOver: true, ending: 'death' };
    }
    
    // Death by Stalker when vulnerable
    if (gameState.stalkerPresence === 'imminent' && !gameState.hasWeapon) {
      return { isOver: true, ending: 'caught' };
    }

    // Victory conditions
    const hasEscapeConditions = gameState.hasKey && 
                               gameState.survivalScore >= 80 && 
                               gameState.encounterCount >= 6;
                               
    const hasVictoryConditions = gameState.hasWeapon && 
                                gameState.survivalScore >= 100 && 
                                gameState.encounterCount >= 8;

    if (hasEscapeConditions || hasVictoryConditions) {
      return { isOver: true, ending: 'victory' };
    }

    return { isOver: false, ending: '' };
  }

  // Simple circumstantial modifiers
  private static getCircumstantialModifier(gameState: GameState, choice: Choice): number {
    let modifier = 0;

    // Injury makes everything harder
    if (gameState.statusEffects.includes('injured')) {
      modifier -= 2;
    }

    // Being hidden helps with stealth
    if (gameState.statusEffects.includes('hidden') && choice.type === 'stealth') {
      modifier += 2;
    }

    // Being exposed makes everything harder
    if (gameState.statusEffects.includes('exposed')) {
      modifier -= 2;
    }

    // Having a weapon helps with combat
    if (gameState.hasWeapon && choice.type === 'combat') {
      modifier += 2;
    }

    // Critical health makes everything harder
    if (gameState.survivalScore < 50) {
      modifier -= 2;
    }

    return modifier;
  }

  static resolveAction(choice: Choice, gameState: GameState) {
    // Roll d20
    const roll = Math.floor(Math.random() * 20) + 1;
    
    // Get circumstantial modifier
    const modifier = this.getCircumstantialModifier(gameState, choice);
    
    // Calculate final roll with modifier
    const finalRoll = roll + modifier;
    
    // Check for success
    const success = finalRoll >= choice.dc;

    // Calculate survival score change
    let survivalDelta = 0;
    if (success) {
      // Reward is based on difficulty - harder challenges give better rewards
      survivalDelta = Math.ceil(choice.dc / 4) * 5;
    } else {
      // Penalty is based on how risky the action was
      survivalDelta = -Math.ceil(Math.abs(choice.riskFactor) / 2);
    }

    // Update game state
    const newGameState = {
      ...gameState,
      survivalScore: Math.min(
        this.MAX_SURVIVAL_SCORE,
        Math.max(
          this.MIN_SURVIVAL_SCORE,
          gameState.survivalScore + survivalDelta
        )
      ),
      // Increment tension on failure
      tension: Math.min(10, gameState.tension + (success ? 0 : 1)),
      // Track encounters
      encounterCount: gameState.encounterCount + (choice.type === 'combat' ? 1 : 0)
    };

    // Progress stalker on failure or high tension
    if (!success || newGameState.tension >= 8) {
      const stalkerProgression: Record<GameState['stalkerPresence'], GameState['stalkerPresence']> = {
        distant: 'hunting',
        hunting: 'closingIn',
        closingIn: 'imminent',
        imminent: 'imminent'
      };
      newGameState.stalkerPresence = stalkerProgression[gameState.stalkerPresence];
    }

    // Generate outcome text
    const outcomeText = `${success ? 'Success' : 'Failure'}! (Rolled ${roll} + ${modifier} = ${finalRoll}, needed ${choice.dc})`;

    return { success, newGameState, outcomeText };
  }

  // Helper method to determine appropriate DC for different actions
  static suggestDC(type: Choice['type'], context: {
    isRisky: boolean,
    isExposed: boolean,
    hasAdvantage: boolean
  }): number {
    let baseRange = this.DC_RANGES.MEDIUM;

    // Determine base range by action type and context
    if (context.isRisky || context.isExposed) {
      baseRange = context.isRisky && context.isExposed ? 
        this.DC_RANGES.DEADLY : this.DC_RANGES.HARD;
    } else if (context.hasAdvantage) {
      baseRange = this.DC_RANGES.EASY;
    }

    // Return a random DC within the determined range
    return Math.floor(
      Math.random() * (baseRange.max - baseRange.min + 1) + baseRange.min
    );
  }
}