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
        throw new Error('No reader available');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        // Process complete JSON objects from the buffer
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep the incomplete line in the buffer

        for (const line of lines) {
          try {
            const data = JSON.parse(line) as StoryResponse;
            setStorySegment(data);
            
            const { isOver, ending } = GameMechanics.checkGameOver(data.gameState);
            if (isOver) {
              setIsGameOver(true);
              // Add appropriate game over text based on ending
              data.story = `${data.story}\n\n${
                ending === 'death' ? 'Your survival score reached zero. Game Over.' :
                ending === 'caught' ? 'The Stalker caught up with you. Game Over.' :
                ending === 'victory' ? 'You defeated The Stalker! Victory!' :
                ending === 'survived' ? 'You survived until dawn! Victory!' :
                'You found a way to escape! Victory!'
              }`;
              setStorySegment(data);
            }

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

            setMessages(prevMessages => [
              ...prevMessages,
              { role: 'assistant', content: JSON.stringify(data) }
            ]);
          } catch (error) {
            console.error('Error parsing JSON chunk:', error);
          }
        }
      }

    } catch (error) {
      console.error('Error fetching story segment:', error);
      const fallbackResponse: StoryResponse = {
        story: 'The shadows grow longer... Perhaps we should try a different path?',
        choices: [{
          text: 'Try another path',
          dc: 10,
          riskFactor: -5,
          rewardValue: 10,
          type: 'search',
          logic: "Safe search option"
        }],
        gameState: currentGameStateRef.current
      };
      setStorySegment(fallbackResponse);
    } finally {
      setIsLoading(false);
      setActionOutcome(null);
    }
  }, [isLoading]);

  // Handle player choices
  const handleChoice = useCallback(async (choice: Choice) => {
    console.log('🎯 Processing player choice:', choice);
    
    // Resolve the action using game mechanics
    const { newGameState, outcomeText } = GameMechanics.resolveAction(choice, currentGameStateRef.current);
    
    // Update game state
    setGameState(newGameState);
    // Update ref immediately
    currentGameStateRef.current = newGameState;
    
    // Set action outcome for display
    setActionOutcome(outcomeText);

    // Create new message from choice with proper typing
    const newMessage: Message = {
      role: 'user',
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
    console.log('🔄 Resetting game...');
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
        console.log('🎮 Starting new game...');
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

export type UseGameLogicReturn = ReturnType<typeof useGameLogic>;
