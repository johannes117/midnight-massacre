import { useState, useCallback, useEffect, useRef } from 'react';
import type { Choice, StoryResponse } from '@/lib/types';
import { GameMechanics } from '@/lib/game-mechanics';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export function useGameLogic() {
  // State Management
  const [storySegment, setStorySegment] = useState<StoryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [gameState, setGameState] = useState(GameMechanics.getInitialGameState());
  const [messages, setMessages] = useState<Message[]>([]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [actionOutcome, setActionOutcome] = useState<string | null>(null);
  
  // Refs for managing component lifecycle and state updates
  const isInitialized = useRef(false);
  const initialFetchComplete = useRef(false);
  const currentGameStateRef = useRef(gameState);

  // Keep ref in sync with current game state
  useEffect(() => {
    currentGameStateRef.current = gameState;
  }, [gameState]);

  // Core story generation logic
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

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No reader available for streaming response');
      }

      let result = '';
      // Process the stream
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        result += new TextDecoder().decode(value);
        
        // Try to parse partial results for progressive updates
        try {
          const partialData = JSON.parse(result);
          if (partialData.story) {
            setStorySegment(prevSegment => ({
              ...prevSegment,
              ...partialData,
            }));
          }
        } catch {
          // Ignore parsing errors for incomplete JSON
          continue;
        }
      }

      // Parse the complete response
      const data: StoryResponse = JSON.parse(result);
      
      // Check game over conditions
      const { isOver, ending } = GameMechanics.checkGameOver(data.gameState);
      if (isOver) {
        setIsGameOver(true);
        // Append appropriate ending text
        switch (ending) {
          case 'death':
            data.story = `${data.story}\n\nYour survival score reached zero. Game Over.`;
            break;
          case 'caught':
            data.story = `${data.story}\n\nThe Stalker caught up with you. Game Over.`;
            break;
          case 'victory':
            data.story = `${data.story}\n\nYou defeated The Stalker! Victory!`;
            break;
          case 'survived':
            data.story = `${data.story}\n\nYou survived until dawn! Victory!`;
            break;
          case 'escaped':
            data.story = `${data.story}\n\nYou found a way to escape! Victory!`;
            break;
        }
      }
      
      // Update story segment with complete data
      setStorySegment(data);
      
      // Update game state while preserving critical values
      setGameState(prevState => ({
        ...data.gameState,
        survivalScore: prevState.survivalScore,
        tension: Math.min(10, prevState.tension),
        progress: {
          ...prevState.progress,
          currentTurn: prevState.progress.currentTurn,
          timeOfNight: GameMechanics.getTimeOfNight(prevState.progress.currentTurn)
        }
      }));
      
      // Add response to message history
      setMessages(prevMessages => [...prevMessages, {
        role: 'assistant',
        content: JSON.stringify(data)
      }]);

    } catch (error) {
      console.error('Error fetching story segment:', error);
      // Provide fallback response
      const fallbackResponse: StoryResponse = {
        story: 'The shadows grow longer... Perhaps we should try a different path?',
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
            text: 'Search for another way',
            dc: 10,
            riskFactor: -5,
            rewardValue: 10,
            type: 'search',
            logic: "Safe search option"
          }
        ],
        gameState: currentGameStateRef.current
      };
      
      setStorySegment(fallbackResponse);
    } finally {
      setIsLoading(false);
      setActionOutcome(null);
      initialFetchComplete.current = true;
    }
  }, [isLoading]);

  // Handle player choices
  const handleChoice = useCallback(async (choice: Choice) => {
    // Resolve the action using game mechanics
    const { newGameState, outcomeText } = GameMechanics.resolveAction(choice, currentGameStateRef.current);
    
    // Update game state
    setGameState(newGameState);
    // Update ref immediately
    currentGameStateRef.current = newGameState;
    
    // Set action outcome for display
    setActionOutcome(outcomeText);

    // Create new message from choice
    const newMessage = {
      role: 'user' as const,
      content: `Player chose: ${choice.text}\nOutcome: ${outcomeText}`
    };

    // Update message history
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    
    // Small delay to ensure state updates are processed
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Generate next story segment
    await fetchStorySegment(updatedMessages);
  }, [messages, fetchStorySegment]);

  // Game reset functionality
  const resetGame = useCallback(() => {
    // Reset all state to initial values
    const initialState = GameMechanics.getInitialGameState();
    setGameState(initialState);
    currentGameStateRef.current = initialState;
    setMessages([]);
    setIsGameOver(false);
    setActionOutcome(null);
    isInitialized.current = false;
    initialFetchComplete.current = false;
    
    // Start new game with initial prompt
    const initialMessage: Message = { 
      role: 'user', 
      content: 'Start a new horror story where I wake up in a dark house, hearing strange noises outside.' 
    };
    fetchStorySegment([initialMessage]);
  }, [fetchStorySegment]);

  // Initialize game on component mount
  useEffect(() => {
    if (!isInitialized.current && !initialFetchComplete.current) {
      isInitialized.current = true;
      
      // Check URL parameters for game start
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

  // Return all necessary state and functions
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

// Hook usage types for better TypeScript support
export type UseGameLogicReturn = ReturnType<typeof useGameLogic>;
