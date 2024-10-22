'use client'

import { useState, useCallback, Suspense, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Volume2, VolumeX, Menu, Home, RotateCcw } from 'lucide-react'
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
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768); // 768px is the standard tablet breakpoint
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

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

  // Handle viewport height for mobile browsers
  useEffect(() => {
    const updateViewportHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    updateViewportHeight();
    window.addEventListener('resize', updateViewportHeight);
    window.addEventListener('orientationchange', updateViewportHeight);

    return () => {
      window.removeEventListener('resize', updateViewportHeight);
      window.removeEventListener('orientationchange', updateViewportHeight);
    };
  }, []);

  const renderGameContent = () => (
    <AnimatePresence mode="wait">
      <motion.div
        key={storySegment?.story || 'loading'}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col h-full"
      >
        <CardContent className={`flex flex-col ${isMobile ? 'h-[calc(100vh-3rem)]' : 'h-full'} p-4 overflow-hidden`}>
          {gameState.hasWeapon && (
            <div className="text-red-400 text-sm text-center pb-2 border-b border-red-800/20">
              You are armed
            </div>
          )}
          
          {/* Scrollable story area */}
          <ScrollArea className={`
            flex-grow px-4 py-3 bg-black/30 rounded-lg shadow-inner border border-red-800/50
            ${isMobile ? 'h-[45vh]' : 'max-h-[60vh]'}
          `}>
            {isLoading ? (
              <SpookyLoader />
            ) : (
              <p className="text-base sm:text-lg leading-relaxed text-red-200">
                {storySegment?.story}
              </p>
            )}
          </ScrollArea>

          {/* Action buttons container */}
          {!isLoading && storySegment && (
            <div className={`
              flex flex-col gap-4 
              ${isMobile ? 'h-[45vh] overflow-y-auto mt-3' : 'mt-6'}
            `}>
              {isGameOver ? renderGameOver() : (
                storySegment.choices.map((choice, index) => (
                  <Button
                    key={index}
                    onClick={() => handleChoice(choice)}
                    className="w-full bg-red-900/50 hover:bg-red-800/70 text-red-100 px-6 py-6 rounded-lg transition-all duration-300 ease-in-out text-left min-h-[80px] flex items-center"
                    disabled={isLoading}
                  >
                    <span className="text-lg sm:text-xl font-medium leading-tight break-words">
                      {choice}
                    </span>
                  </Button>
                ))
              )}
            </div>
          )}
        </CardContent>
      </motion.div>
    </AnimatePresence>
  );

  return (
    <div 
      className="fixed inset-0 bg-gradient-to-b from-red-900 via-black to-purple-900 text-red-100 flex flex-col"
      style={{ height: 'calc(var(--vh, 1vh) * 100)' }}
    >
      <FloatingParticles />
      
      {/* Header with controls */}
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
              <hr className="border-red-800/30" />
              <Button
                variant="ghost"
                onClick={() => router.push('/')}
                className="w-full text-red-400 hover:text-red-300 bg-black/30 hover:bg-black/50"
              >
                <Home className="h-5 w-5 mr-2" />
                Give Up
              </Button>
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

      {/* Main game content */}
      <div className={`flex-1 ${!isMobile && 'flex items-center justify-center p-4'}`}>
        <Suspense fallback={<SpookyLoader />}>
          <SearchParamsWrapper>
            {() => (
              <Card className={`
                bg-black/70 border-red-800 shadow-lg backdrop-blur-sm overflow-hidden
                ${isMobile ? 'h-full rounded-none' : 'w-full max-w-2xl'}
              `}>
                {renderGameContent()}
              </Card>
            )}
          </SearchParamsWrapper>
        </Suspense>
      </div>
    </div>
  );
}
