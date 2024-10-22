'use client'

import { useState, useCallback, Suspense, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Volume2, VolumeX, ChevronRight, Menu, ArrowLeft, RotateCcw, Home } from 'lucide-react'
import { ScrollArea } from "@/components/ui/scroll-area"
import { motion, AnimatePresence } from "framer-motion"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { FloatingParticles } from "@/components/floating-particles"
import SpookyLoader from './spooky-loader'
import dynamic from 'next/dynamic'
import { useAudioContext } from '@/components/audio-provider'

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
  const { isMuted, toggleMute } = useAudioContext()
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

  const renderGameOver = useCallback(() => {
    const isVictory = storySegment?.story.toLowerCase().includes('you survived') || 
                     storySegment?.story.toLowerCase().includes('you escaped');
    
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full space-y-4 text-center"
      >
        <h2 className={`text-3xl font-bold ${isVictory ? 'text-green-500' : 'text-red-500'}`}>
          {isVictory ? 'You Survived!' : 'Game Over'}
        </h2>
        <div className="flex justify-center gap-4">
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
    <div className="min-h-[100dvh] bg-gradient-to-b from-red-900 via-black to-purple-900 text-red-100 flex flex-col relative overflow-hidden">
      <FloatingParticles />
      
      {/* Header with controls - Fixed at top */}
      <div className="w-full px-4 py-2 flex justify-between items-center bg-black/50 backdrop-blur-sm z-20 border-b border-red-800/30">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-red-400 hover:text-red-300 bg-black/30 hover:bg-black/50 rounded-full transition-colors"
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
        
        <h1 className="text-2xl sm:text-3xl font-horror text-red-500 tracking-wider text-center">
          MIDNIGHT MASSACRE
        </h1>
        
        <Button
          variant="ghost"
          size="icon"
          className="text-red-400 hover:text-red-300 bg-black/30 hover:bg-black/50 rounded-full transition-colors"
          onClick={toggleMute}
        >
          {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
        </Button>
      </div>

      {/* Main game content - Fills remaining space */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
        <Suspense fallback={<SpookyLoader />}>
          <SearchParamsWrapper>
            {() => (
              <Card className="w-full max-w-2xl h-[calc(100dvh-8rem)] bg-black/70 border-red-800 shadow-lg backdrop-blur-sm overflow-hidden flex flex-col">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={storySegment?.story || 'loading'}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col h-full"
                  >
                    <CardContent className="flex flex-col p-4 space-y-4 flex-grow overflow-hidden">
                      {gameState.hasWeapon && (
                        <div className="text-red-400 text-sm text-center">You are armed</div>
                      )}
                      
                      {/* Scrollable story area */}
                      <ScrollArea className="flex-grow p-4 bg-black/30 rounded-lg shadow-inner border border-red-800/50">
                        {isLoading ? (
                          <SpookyLoader />
                        ) : (
                          <p className="text-lg leading-relaxed text-red-200">
                            {storySegment?.story}
                          </p>
                        )}
                      </ScrollArea>

                      {/* Fixed-height choices container */}
                      {!isLoading && storySegment && (
                        <div className="space-y-2 min-h-[120px] flex flex-col">
                          {isGameOver ? renderGameOver() : (
                            storySegment.choices.map((choice, index) => (
                              <Button
                                key={index}
                                onClick={() => handleChoice(choice)}
                                className="w-full min-h-[40px] h-auto bg-red-900/50 hover:bg-red-800/70 text-red-100 font-medium py-2 px-4 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-102 hover:shadow-red-500/30 hover:shadow-md text-left flex justify-between items-center whitespace-normal"
                                disabled={isLoading}
                              >
                                <span className="flex-grow mr-2">{choice}</span>
                                <ChevronRight className="h-5 w-5 flex-shrink-0" />
                              </Button>
                            ))
                          )}
                        </div>
                      )}
                    </CardContent>
                    
                    <CardFooter className="p-4 border-t border-red-800/30">
                      <Button
                        variant="ghost"
                        onClick={() => router.push('/')}
                        className="text-red-400 hover:text-red-300 bg-black/30 hover:bg-black/50"
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
      </div>
    </div>
  )
}