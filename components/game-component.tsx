'use client'

import { useState, useCallback, Suspense, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Volume2, VolumeX, ChevronRight, Menu, ArrowLeft, RotateCcw, Home } from 'lucide-react'
import { ScrollArea } from "@/components/ui/scroll-area"
import { motion, AnimatePresence } from "framer-motion"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { FloatingGhosts } from "@/components/floating-ghosts"
import SpookyLoader from './spooky-loader'
import dynamic from 'next/dynamic'

const SearchParamsWrapper = dynamic(() => import('@/components/search-params-wrapper'), { ssr: false })

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface GameState {
  hasWeapon: boolean;
  hasKey: boolean;
  tension: number;
  encounterCount: number;
}

interface StoryResponse {
  story: string;
  choices: string[];
  gameState: GameState;
}

const INITIAL_GAME_STATE: GameState = {
  hasWeapon: false,
  hasKey: false,
  tension: 0,
  encounterCount: 0,
};

export function GameComponent() {
  const router = useRouter()
  const [storySegment, setStorySegment] = useState<StoryResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [gameState, setGameState] = useState<GameState>(INITIAL_GAME_STATE)
  const [messages, setMessages] = useState<Message[]>([])
  const [isGameOver, setIsGameOver] = useState(false)

  const fetchStorySegment = useCallback(async (currentMessages: Message[]) => {
    setIsLoading(true);
    
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
      
      setStorySegment(data);
      setGameState(data.gameState);
      setMessages(prevMessages => [...prevMessages, {
        role: 'assistant',
        content: JSON.stringify(data)
      }]);

      // Check for game over conditions
      const storyLower = data.story.toLowerCase();
      if (storyLower.includes('game over') || 
          storyLower.includes('you died') ||
          storyLower.includes('you escaped') ||
          storyLower.includes('you survived')) {
        setIsGameOver(true);
      }
    } catch (error) {
      console.error('Error fetching story segment:', error);
      setStorySegment({
        story: 'The Stalker draws near... Perhaps we should try a different path?',
        choices: ['Run and hide', 'Look for another way', 'Face your fate'],
        gameState: INITIAL_GAME_STATE
      });
    } finally {
      setIsLoading(false);
    }
  }, [gameState]);

  const resetGame = useCallback(() => {
    setGameState(INITIAL_GAME_STATE);
    setMessages([]);
    setIsGameOver(false);
    const initialMessage: Message = { 
      role: 'user', 
      content: 'Start a new horror story where I wake up in a dark house, hearing strange noises outside.' 
    };
    fetchStorySegment([initialMessage]);
  }, [fetchStorySegment]);

  const handleChoice = useCallback(async (choice: string) => {
    const userMessage: Message = { role: 'user', content: `I choose: ${choice}` }
    const updatedMessages = [...messages, userMessage]
    await fetchStorySegment(updatedMessages)
  }, [messages, fetchStorySegment]);

  const renderChoice = useCallback((choice: string, index: number) => {
    return (
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
      >
        <Button
          onClick={() => handleChoice(choice)}
          className="w-full h-auto min-h-[3rem] bg-red-900/50 hover:bg-red-800/70 text-red-100 font-medium py-2 px-4 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-102 hover:shadow-red-500/30 hover:shadow-md text-left flex justify-between items-center"
          disabled={isLoading}
        >
          <span className="line-clamp-2 flex-grow">{choice}</span>
          <ChevronRight className="h-5 w-5 flex-shrink-0 ml-2" />
        </Button>
      </motion.div>
    );
  }, [handleChoice, isLoading]);

  const renderGameOver = useCallback(() => {
    const isVictory = storySegment?.story.toLowerCase().includes('you survived') || 
                     storySegment?.story.toLowerCase().includes('you escaped');
    
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full space-y-6 text-center"
      >
        <h2 className={`text-3xl font-bold ${isVictory ? 'text-green-500' : 'text-red-500'}`}>
          {isVictory ? 'You Survived!' : 'Game Over'}
        </h2>
        <div className="flex justify-center space-x-4">
          <Button
            onClick={resetGame}
            className="bg-red-900/50 hover:bg-red-800/70 text-red-100"
          >
            <RotateCcw className="h-5 w-5 mr-2" />
            Try Again
          </Button>
          <Button
            onClick={() => router.push('/')}
            className="bg-red-900/50 hover:bg-red-800/70 text-red-100"
          >
            <Home className="h-5 w-5 mr-2" />
            Main Menu
          </Button>
        </div>
      </motion.div>
    );
  }, [storySegment?.story, resetGame, router]);

  const handleSearchParams = useCallback((searchParams: URLSearchParams) => {
    const startGame = searchParams.get('start') === 'true';
    if (startGame && messages.length === 0) {
      const initialMessage: Message = { 
        role: 'user', 
        content: 'Start a new horror story where I wake up in a dark house, hearing strange noises outside.' 
      };
      return initialMessage;
    } else if (messages.length === 0) {
      router.push('/');
    }
    return null;
  }, [router, messages]);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const initialMessage = handleSearchParams(searchParams);
    if (initialMessage) {
      fetchStorySegment([initialMessage]);
    }
  }, [handleSearchParams, fetchStorySegment]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-900 via-black to-purple-900 text-red-100 p-4 sm:p-6 md:p-8 flex flex-col items-center justify-center overflow-hidden relative">
      <FloatingGhosts />
      
      <Suspense fallback={<SpookyLoader />}>
        <SearchParamsWrapper>
          {() => (
            <Card className="w-full max-w-2xl h-[calc(100vh-2rem)] sm:h-auto sm:max-h-[calc(100vh-4rem)] bg-black/70 border-red-800 shadow-lg backdrop-blur-sm overflow-hidden flex flex-col">
              <AnimatePresence mode="wait">
                <motion.div
                  key={storySegment?.story || 'loading'}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col h-full"
                >
                  <CardContent className="flex flex-col items-center p-6 space-y-6 flex-grow overflow-hidden">
                    {gameState.hasWeapon && (
                      <div className="text-red-400 text-sm">You are armed</div>
                    )}
                    <ScrollArea className="w-full flex-grow p-4 bg-black/30 rounded-lg shadow-inner border border-red-800/50">
                      {isLoading ? (
                        <SpookyLoader />
                      ) : (
                        <p className="text-lg leading-relaxed text-red-200">
                          {storySegment?.story}
                        </p>
                      )}
                    </ScrollArea>
                    {!isLoading && storySegment && (
                      <div className="w-full space-y-4">
                        {isGameOver ? renderGameOver() : storySegment.choices.map((choice, index) => renderChoice(choice, index))}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button
                      variant="ghost"
                      onClick={() => router.push('/')}
                      className="text-red-400 hover:text-red-300 bg-black/30 hover:bg-black/50 rounded-full transition-colors"
                    >
                      <ArrowLeft className="h-5 w-5 mr-2" />
                      Give Up
                    </Button>
                  </CardFooter>
                </motion.div>
              </AnimatePresence>
            </Card>
          )}
        </SearchParamsWrapper>
      </Suspense>

      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 text-red-400 hover:text-red-300 bg-black/30 hover:bg-black/50 rounded-full transition-colors"
        onClick={() => setIsMuted(!isMuted)}
      >
        {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
      </Button>

      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 left-4 text-red-400 hover:text-red-300 bg-black/30 hover:bg-black/50 rounded-full transition-colors"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[300px] sm:w-[400px] bg-black/90 border-red-800">
          <SheetTitle className="text-lg font-semibold text-red-400 mb-4">Game Status</SheetTitle>
          <div className="space-y-4 text-red-200">
            <div>Tension Level: {gameState.tension}/10</div>
            <div>Items Found: {[
              gameState.hasWeapon && 'Weapon',
              gameState.hasKey && 'Key'
            ].filter(Boolean).join(', ') || 'None'}</div>
            <div>Encounters: {gameState.encounterCount}</div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
