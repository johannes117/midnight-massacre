'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Volume2, VolumeX, Menu, Home } from 'lucide-react'
import { ScrollArea } from "@/components/ui/scroll-area"
import { motion, AnimatePresence } from "framer-motion"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { FloatingParticles } from "@/components/floating-particles"
import SpookyLoader from './spooky-loader'
import dynamic from 'next/dynamic'
import { useAudioContext } from '@/components/audio-provider'
import { GameStatus } from './game-status'
import { GameOver } from './game-over'
import { GameChoices } from './game-choices'
import { useGameLogic } from '@/hooks/useGameLogic'
import { TimeOfNight } from '@/lib/types'
import GameProgress from './game-progress'

const SearchParamsWrapper = dynamic(() => import('@/components/search-params-wrapper'), { ssr: false })

const timeBackgrounds: Record<TimeOfNight, string> = {
  dusk: 'from-orange-900 via-black to-purple-900',
  midnight: 'from-indigo-950 via-black to-purple-950',
  lateNight: 'from-purple-950 via-black to-blue-950',
  nearDawn: 'from-blue-950 via-black to-indigo-950',
  dawn: 'from-indigo-900 via-purple-900 to-orange-900'
}

export function GameComponent() {
  const router = useRouter()
  const { isMuted, toggleMute } = useAudioContext()
  const [isMobile, setIsMobile] = useState(false)
  const {
    storySegment,
    isLoading,
    gameState,
    isGameOver,
    handleChoice,
    resetGame,
    actionOutcome
  } = useGameLogic()

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

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
          <div className="mb-4">
            <GameProgress gameState={gameState} />
          </div>

          <GameStatus gameState={gameState} actionOutcome={actionOutcome} />
          
          <ScrollArea className={`
            flex-grow px-4 py-3 bg-black/30 rounded-lg shadow-inner border border-orange-800/50
            ${isMobile ? 'h-[45vh]' : 'max-h-[60vh]'}
          `}>
            {isLoading ? (
              <SpookyLoader />
            ) : (
              <p className="text-base sm:text-lg leading-relaxed text-orange-200">
                {storySegment?.story}
              </p>
            )}
          </ScrollArea>

          {!isLoading && storySegment && (
            <div className={`
              ${isMobile ? 'h-[45vh] overflow-y-auto mt-3' : 'mt-6'}
            `}>
              {isGameOver ? (
                <GameOver 
                  isVictory={storySegment?.story.toLowerCase().includes('victory') || 
                             storySegment?.story.toLowerCase().includes('escaped')}
                  resetGame={resetGame}
                />
              ) : (
                <GameChoices 
                  choices={storySegment.choices}
                  handleChoice={handleChoice}
                  isLoading={isLoading}
                />
              )}
            </div>
          )}
        </CardContent>
      </motion.div>
    </AnimatePresence>
  );

  return (
    <div 
      className={`fixed inset-0 bg-gradient-to-b ${
        timeBackgrounds[gameState.progress.timeOfNight]
      } text-orange-100 flex flex-col transition-colors duration-1000`}
      style={{ height: 'calc(var(--vh, 1vh) * 100)' }}
    >
      <FloatingParticles />
      
      <div className="w-full px-4 py-2 flex justify-between items-center bg-black/50 backdrop-blur-sm z-20 border-b border-orange-800/30">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-orange-400 hover:text-orange-300 bg-black/30 hover:bg-black/50 rounded-full transition-colors"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          
          <SheetContent side="left" className="w-[300px] sm:w-[400px] bg-black/90 border-orange-800">
            <SheetTitle className="text-lg font-semibold text-orange-400 mb-4">Game Status</SheetTitle>
            <div className="space-y-4 text-orange-200">
              {gameState ? (
                <>
                  <div>Survival Score: {gameState.survivalScore}/100</div>
                  <div>Stalker Presence: {gameState.stalkerPresence}</div>
                  <div>Tension Level: {gameState.tension}/10</div>
                  <div>Items Found: {[
                    gameState.hasWeapon && 'Weapon',
                    gameState.hasKey && 'Key'
                  ].filter(Boolean).join(', ') || 'None'}</div>
                  <div>Status Effects: {gameState.statusEffects.join(', ') || 'None'}</div>
                  <div>Encounters: {gameState.encounterCount}</div>
                </>
              ) : (
                <div>Loading game state...</div>
              )}
              <hr className="border-orange-800/30" />
              <Button
                variant="ghost"
                onClick={() => router.push('/')}
                className="w-full text-orange-400 hover:text-orange-300 bg-black/30 hover:bg-black/50"
              >
                <Home className="h-5 w-5 mr-2" />
                Give Up
              </Button>
            </div>
          </SheetContent>
        </Sheet>
        
        <h1 className="text-2xl sm:text-3xl font-horror text-orange-500 tracking-wider text-center">
          MIDNIGHT MASSACRE
        </h1>
        
        <Button
          variant="ghost"
          size="icon"
          className="text-orange-400 hover:text-orange-300 bg-black/30 hover:bg-black/50 rounded-full transition-colors"
          onClick={toggleMute}
        >
          {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
        </Button>
      </div>

      <div className={`flex-1 ${!isMobile && 'flex items-center justify-center p-4'}`}>
        <SearchParamsWrapper>
          {() => (
            <Card className={`
              bg-black/70 border-orange-800 shadow-lg backdrop-blur-sm overflow-hidden
              ${isMobile ? 'h-full rounded-none' : 'w-full max-w-2xl'}
            `}>
              {renderGameContent()}
            </Card>
          )}
        </SearchParamsWrapper>
      </div>
    </div>
  );
}
