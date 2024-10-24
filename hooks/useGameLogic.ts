import { useState, useCallback, useEffect, useRef } from 'react';
import type { Choice, GameState } from '@/lib/types';
import { GameMechanics } from '@/lib/game-mechanics';

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
  
  const isInitialized = useRef(false);
  const initialFetchComplete = useRef(false);
  // Add ref to track the current game state for accurate updates
  const currentGameStateRef = useRef(gameState);

  // Update ref when gameState changes
  useEffect(() => {
    currentGameStateRef.current = gameState;
  }, [gameState]);

  const fetchStorySegment = useCallback(async (currentMessages: Message[]) => {
    if (isLoading) return;
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/generate-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: currentMessages,
          gameState: currentGameStateRef.current
        }),
      });

      const responseText = await response.text();
      console.log('Response Text:', responseText); // Log the response text

      const data: StoryResponse = JSON.parse(responseText); // Parse the response text
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
      
      // Preserve critical game state values while updating with new data
      setGameState(prevState => ({
        ...data.gameState,
        survivalScore: prevState.survivalScore, // Preserve current survival score
        tension: prevState.tension, // Preserve current tension
        progress: {
          ...prevState.progress,
          currentTurn: prevState.progress.currentTurn,
          timeOfNight: GameMechanics.getTimeOfNight(prevState.progress.currentTurn)
        }
      }));
      
      setMessages(prevMessages => [...prevMessages, {
        role: 'assistant',
        content: JSON.stringify(data)
      }]);
    } catch (error) {
      console.error('Error fetching story segment:', error);
      // Fallback maintains current game state values
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
          }
        ],
        gameState: currentGameStateRef.current // Use current state for fallback
      });
    } finally {
      setIsLoading(false);
      setActionOutcome(null);
      initialFetchComplete.current = true;
    }
  }, [isLoading]);

  const handleChoice = useCallback(async (choice: Choice) => {
    // Calculate new state based on the current state from ref
    const { newGameState, outcomeText } = GameMechanics.resolveAction(choice, currentGameStateRef.current);
    
    // Update game state first
    setGameState(newGameState);
    // Update ref immediately to ensure latest state for next updates
    currentGameStateRef.current = newGameState;
    
    setActionOutcome(outcomeText);

    const newMessage = {
      role: 'user' as const,
      content: `Player chose: ${choice.text}\nOutcome: ${outcomeText}`
    };

    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    
    // Small delay to ensure state updates are processed
    await new Promise(resolve => setTimeout(resolve, 0));
    await fetchStorySegment(updatedMessages);
  }, [messages, fetchStorySegment]);

  const resetGame = useCallback(() => {
    const initialState = GameMechanics.getInitialGameState();
    setGameState(initialState);
    currentGameStateRef.current = initialState; // Update ref with initial state
    setMessages([]);
    setIsGameOver(false);
    setActionOutcome(null);
    isInitialized.current = false;
    initialFetchComplete.current = false;
    
    const initialMessage: Message = { 
      role: 'user', 
      content: 'Start a new horror story where I wake up in a dark house, hearing strange noises outside.' 
    };
    fetchStorySegment([initialMessage]);
  }, [fetchStorySegment]);

  useEffect(() => {
    if (!isInitialized.current && !initialFetchComplete.current) {
      isInitialized.current = true;
      const searchParams = new URLSearchParams(window.location.search);
      const startGame = searchParams.get('start') === 'true';
      
      if (startGame) {
        const initialMessage: Message = { 
          role: 'user', 
          content: 'Start a new horror story where I wake up in a dark house, hearing strange noises outside.' 
        };
        fetchStorySegment([initialMessage]);
      }
    }
  }, [fetchStorySegment]);

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
