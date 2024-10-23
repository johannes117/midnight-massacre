// /hooks/useGameLogic.ts
import { useState, useCallback, useEffect } from 'react';
import type { Choice, GameState } from '@/lib/types';
import { GameMechanics } from '@/lib/game-mechanics';

// Define message and story response types locally since they're specific to the API interaction
interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface StoryResponse {
  story: string;
  choices: Choice[];
  gameState: GameState;
}

export function useGameLogic() {
  const [storySegment, setStorySegment] = useState<StoryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [gameState, setGameState] = useState(GameMechanics.getInitialGameState());
  const [messages, setMessages] = useState<Message[]>([]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [actionOutcome, setActionOutcome] = useState<string | null>(null);

  const fetchStorySegment = useCallback(async (currentMessages: Message[]) => {
    setIsLoading(true);
    console.log('Current turn before fetch:', gameState.progress.currentTurn);
    
    try {
      const response = await fetch('/api/generate-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: currentMessages,
          gameState 
        }),
      });
  
      const data: StoryResponse = await response.json();
      console.log('Turn from API response:', data.gameState.progress.currentTurn);
      
      // Check game over conditions
      const { isOver, ending } = GameMechanics.checkGameOver(data.gameState);
      if (isOver) {
        setIsGameOver(true);
        if (ending === 'death') {
          data.story = `${data.story}\n\nYour survival score reached zero. Game Over.`;
        } else if (ending === 'caught') {
          data.story = `${data.story}\n\nThe Stalker caught up with you. Game Over.`;
        } else if (ending === 'victory') {
          data.story = `${data.story}\n\nYou defeated The Stalker! Victory!`;
        } else if (ending === 'survived') {
          data.story = `${data.story}\n\nYou survived until dawn! Victory!`;
        }
      }
      
      setStorySegment(data);
      setGameState(prevState => {
        console.log('Updating turn from:', prevState.progress.currentTurn, 'to:', prevState.progress.currentTurn);
        return {
          ...data.gameState,
          progress: {
            ...prevState.progress,
            timeOfNight: GameMechanics.getTimeOfNight(prevState.progress.currentTurn)
          }
        };
      });
      setMessages(prevMessages => [...prevMessages, {
        role: 'assistant',
        content: JSON.stringify(data)
      }]);
    } catch (error) {
      console.error('Error fetching story segment:', error);
      // Create fallback response using GameMechanics initial state
      setStorySegment({
        story: 'The Stalker draws near... Perhaps we should try a different path?',
        choices: [
          {
            text: 'Run and hide',
            dc: 12,
            riskFactor: -10,
            rewardValue: 15,
            type: 'stealth',
            logic: "Basic stealth option"
          },
          {
            text: 'Look for another way',
            dc: 10,
            riskFactor: -5,
            rewardValue: 10,
            type: 'search',
            logic: "Safe search option"
          },
          {
            text: 'Face your fate',
            dc: 15,
            riskFactor: -20,
            rewardValue: 20,
            type: 'combat',
            logic: "Risky combat option"
          }
        ],
        gameState: GameMechanics.getInitialGameState()
      });
    } finally {
      setIsLoading(false);
      setActionOutcome(null);
    }
  }, [gameState]);

  const resetGame = useCallback(() => {
    const initialState = GameMechanics.getInitialGameState();
    setGameState(initialState);
    setMessages([]);
    setIsGameOver(false);
    setActionOutcome(null);
    const initialMessage: Message = { 
      role: 'user', 
      content: 'Start a new horror story where I wake up in a dark house, hearing strange noises outside.' 
    };
    fetchStorySegment([initialMessage]);
  }, [fetchStorySegment]);

  const handleChoice = useCallback(async (choice: Choice) => {
    console.log('Handle choice - current turn:', gameState.progress.currentTurn);
    const { newGameState, outcomeText } = GameMechanics.resolveAction(choice, gameState);
    console.log('After resolve action - new turn:', newGameState.progress.currentTurn);
    
    setGameState(newGameState);
    setActionOutcome(outcomeText);

    const newMessage = {
      role: 'user' as const,
      content: `Player chose: ${choice.text}\nOutcome: ${outcomeText}`
    };

    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    await fetchStorySegment(updatedMessages);
  }, [gameState, messages, fetchStorySegment]);

  const handleSearchParams = useCallback((searchParams: URLSearchParams) => {
    const startGame = searchParams.get('start') === 'true';
    if (startGame && messages.length === 0) {
      const initialMessage: Message = { 
        role: 'user', 
        content: 'Start a new horror story where I wake up in a dark house, hearing strange noises outside.' 
      };
      return initialMessage;
    }
    return null;
  }, [messages]);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const initialMessage = handleSearchParams(searchParams);
    if (initialMessage) {
      fetchStorySegment([initialMessage]);
    }
  }, [handleSearchParams, fetchStorySegment]);

  // Initial story fetch
  useEffect(() => {
    if (messages.length === 0) {
      console.log('Initial story fetch - starting turn:', gameState.progress.currentTurn);
      fetchStorySegment([]);
    }
  }, [fetchStorySegment, messages.length, gameState.progress.currentTurn]);

  return {
    storySegment,
    isLoading,
    gameState,
    isGameOver,
    handleChoice,
    resetGame,
    actionOutcome
  };
}
