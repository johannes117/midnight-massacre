'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Volume2, VolumeX, Menu, Home, Ghost, Shield, Heart, Skull, Key } from 'lucide-react'
import { ScrollArea } from "@/components/ui/scroll-area"
import { motion, AnimatePresence } from "framer-motion"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { FloatingParticles } from "@/components/floating-particles"
import { Alert, AlertDescription } from "@/components/ui/alert"
import SpookyLoader from './spooky-loader'
import dynamic from 'next/dynamic'
import { useAudioContext } from '@/components/audio-provider'
import { GameStatus } from './game-status'
import { GameOver } from './game-over'
import { GameChoices } from './game-choices'
import { useGameLogic } from '@/hooks/useGameLogic'
import { TimeOfNight, StatusEffect, StalkerPresence, GameState } from '@/lib/types'
import GameProgress from './game-progress'

const SearchParamsWrapper = dynamic(() => import('@/components/search-params-wrapper'), { ssr: false })

const timeBackgrounds: Record<TimeOfNight, string> = {
  dusk: 'from-orange-900 via-black to-purple-900',
  midnight: 'from-indigo-950 via-black to-purple-950',
  lateNight: 'from-purple-950 via-black to-blue-950',
  nearDawn: 'from-blue-950 via-black to-indigo-950',
  dawn: 'from-indigo-900 via-purple-900 to-orange-900'
}

// Helper components for the status panel
const StatusEffectIcon = ({ effect }: { effect: StatusEffect }) => {
  const icons = {
    injured: <Heart className="text-red-500" />,
    hidden: <Ghost className="text-blue-400" />,
    exposed: <Shield className="text-yellow-500" />,
    bleeding: <Heart className="text-red-600" />,
    empowered: <Shield className="text-green-500" />
  }
  const labels = {
    injured: "-2 to all rolls",
    hidden: "+2 to stealth",
    exposed: "-2 to all rolls",
    bleeding: "Decreasing survival",
    empowered: "+2 to combat"
  }
  return (
    <div className="flex items-center gap-2 text-sm">
      {icons[effect]}
      <span>{effect}</span>
      <span className="text-xs text-orange-400">({labels[effect]})</span>
    </div>
  )
}

const StalkerPresenceIndicator = ({ presence }: { presence: StalkerPresence }) => {
  const getPresenceColor = (presence: StalkerPresence) => {
    switch (presence) {
      case 'distant': return 'text-green-500'
      case 'hunting': return 'text-yellow-500'
      case 'closingIn': return 'text-orange-500'
      case 'imminent': return 'text-red-500'
      default: return 'text-white'
    }
  }
  
  return (
    <div className="flex items-center gap-2">
      <Skull className={`w-5 h-5 ${getPresenceColor(presence)}`} />
      <span className={`capitalize ${getPresenceColor(presence)}`}>
        {presence.replace(/([A-Z])/g, ' $1').trim()}
      </span>
    </div>
  )
}

const TensionMeter = ({ tension }: { tension: number }) => {
  const segments = Array.from({ length: 10 }, (_, i) => i < tension)
  
  return (
    <div className="flex gap-1">
      {segments.map((isActive, i) => (
        <div
          key={i}
          className={`h-2 w-4 rounded ${
            isActive 
              ? `bg-gradient-to-r ${
                  i < 3 ? 'from-green-500 to-green-600' :
                  i < 6 ? 'from-yellow-500 to-yellow-600' :
                  i < 8 ? 'from-orange-500 to-orange-600' :
                  'from-red-500 to-red-600'
                }`
              : 'bg-gray-700'
          }`}
        />
      ))}
    </div>
  )
}

const StatusPanel = ({ gameState }: { gameState: GameState }) => (
  <div className="space-y-6 text-orange-200">
    {/* Survival Score */}
    <div className="space-y-2">
      <h3 className="font-semibold">Survival Score</h3>
      <div className="flex items-center gap-2">
        <div className="w-full bg-black/30 rounded-full h-4">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              gameState.survivalScore > 80 ? 'bg-green-500' :
              gameState.survivalScore > 50 ? 'bg-yellow-500' :
              'bg-red-500'
            }`}
            style={{ width: `${gameState.survivalScore}%` }}
          />
        </div>
        <span className="min-w-[4rem] text-right">
          {gameState.survivalScore}/100
        </span>
      </div>
    </div>

    {/* Stalker Presence */}
    <div className="space-y-2">
      <h3 className="font-semibold">Stalker Presence</h3>
      <StalkerPresenceIndicator presence={gameState.stalkerPresence} />
    </div>

    {/* Tension Level */}
    <div className="space-y-2">
      <h3 className="font-semibold">Tension Level</h3>
      <div className="flex items-center gap-2">
        <TensionMeter tension={gameState.tension} />
        <span>{gameState.tension}/10</span>
      </div>
    </div>

    {/* Status Effects */}
    {gameState.statusEffects.length > 0 && (
      <div className="space-y-2">
        <h3 className="font-semibold">Status Effects</h3>
        <div className="space-y-1">
          {gameState.statusEffects.map(effect => (
            <StatusEffectIcon key={effect} effect={effect} />
          ))}
        </div>
      </div>
    )}

    {/* Items */}
    <div className="space-y-2">
      <h3 className="font-semibold">Items</h3>
      <div className="space-y-1">
        {gameState.hasWeapon && (
          <div className="flex items-center gap-2">
            <Shield className="text-green-500" />
            <span>Weapon</span>
          </div>
        )}
        {gameState.hasKey && (
          <div className="flex items-center gap-2">
            <Key className="text-yellow-500" />
            <span>Key</span>
          </div>
        )}
        {!gameState.hasWeapon && !gameState.hasKey && (
          <span className="text-orange-400/50">No items found</span>
        )}
      </div>
    </div>

    {/* Critical Alerts */}
    {gameState.tension >= 8 && (
      <Alert variant="destructive" className="bg-red-900/20 border-red-900">
        <AlertDescription>
          Stalker presence is extremely high. Be careful!
        </AlertDescription>
      </Alert>
    )}
    
    {gameState.survivalScore <= 50 && (
      <Alert variant="destructive" className="bg-red-900/20 border-red-900">
        <AlertDescription>
          You are critically wounded!
        </AlertDescription>
      </Alert>
    )}

    {/* Statistics */}
    <div className="space-y-2 pt-4 border-t border-orange-800/30">
      <h3 className="font-semibold">Statistics</h3>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>Encounters: {gameState.encounterCount}</div>
        <div>Failed Rolls: {gameState.failedRollsCount}</div>
      </div>
    </div>
  </div>
);

export function GameComponent() {
  const router = useRouter()
  const { isMuted, toggleMute } = useAudioContext()
  const [isMobile, setIsMobile] = useState(false)
  const [isStatusOpen, setIsStatusOpen] = useState(false)
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
        className="flex flex-col"
      >
        <CardContent className="flex flex-col p-4 overflow-hidden relative">
          <div className="mb-4">
            <GameProgress gameState={gameState} />
          </div>

          <GameStatus gameState={gameState} actionOutcome={actionOutcome} />
          
          <ScrollArea className="flex-grow px-4 py-3 bg-black/30 rounded-lg shadow-inner border border-orange-800/50 min-h-[200px] max-h-[40vh]">
            {isLoading ? (
              <SpookyLoader />
            ) : (
              <div className="space-y-4">
                {gameState.statusEffects.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {gameState.statusEffects.map(effect => (
                      <StatusEffectIcon key={effect} effect={effect} />
                    ))}
                  </div>
                )}
                
                <p className="text-base sm:text-lg leading-relaxed text-orange-200">
                  {storySegment?.story}
                </p>
              </div>
            )}
          </ScrollArea>

          {!isLoading && storySegment && (
            <div className="mt-4 min-h-[150px] max-h-[calc(40vh-2rem)] overflow-hidden">
              {isGameOver ? (
                <GameOver 
                  isVictory={storySegment?.story.toLowerCase().includes('victory') || 
                             storySegment?.story.toLowerCase().includes('escaped')}
                  resetGame={resetGame}
                />
              ) : (
                <ScrollArea className="h-full pr-4">
                  <GameChoices 
                    choices={storySegment.choices}
                    handleChoice={handleChoice}
                    isLoading={isLoading}
                  />
                </ScrollArea>
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
        <Sheet open={isStatusOpen} onOpenChange={setIsStatusOpen}>
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
            <StatusPanel gameState={gameState} />
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
              ${isMobile 
                ? 'h-full rounded-none' 
                : 'w-full max-w-2xl flex flex-col'
              }
            `}>
              {renderGameContent()}
            </Card>
          )}
        </SearchParamsWrapper>
      </div>

      {/* Quick Status Bar - Mobile Only */}
      {isMobile && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-sm border-t border-orange-800/30 p-2"
        >
          <div className="flex justify-between items-center gap-4">
            {/* Survival Score */}
            <div className="flex items-center gap-2">
              <Heart className={`w-4 h-4 ${
                gameState.survivalScore > 80 ? 'text-green-500' :
                gameState.survivalScore > 50 ? 'text-yellow-500' :
                'text-red-500'
              }`} />
              <div className="w-16 bg-black/30 rounded-full h-2">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    gameState.survivalScore > 80 ? 'bg-green-500' :
                    gameState.survivalScore > 50 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${gameState.survivalScore}%` }}
                />
              </div>
            </div>

            {/* Tension Level */}
            <div className="flex items-center gap-2">
              <Skull className={`w-4 h-4 ${
                gameState.tension >= 8 ? 'text-red-500' :
                gameState.tension >= 5 ? 'text-orange-500' :
                'text-yellow-500'
              }`} />
              <TensionMeter tension={gameState.tension} />
            </div>

            {/* Status Effects Icons */}
            <div className="flex gap-1">
              {gameState.statusEffects.map(effect => (
                <motion.div
                  key={effect}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-4 h-4"
                >
                  {effect === 'injured' && <Heart className="w-full h-full text-red-500" />}
                  {effect === 'hidden' && <Ghost className="w-full h-full text-blue-400" />}
                  {effect === 'exposed' && <Shield className="w-full h-full text-yellow-500" />}
                  {effect === 'bleeding' && <Heart className="w-full h-full text-red-600" />}
                  {effect === 'empowered' && <Shield className="w-full h-full text-green-500" />}
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Critical Alerts */}
      <AnimatePresence>
        {gameState.tension >= 8 && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50"
          >
            <Alert variant="destructive" className="bg-red-900/90 border-red-900">
              <AlertDescription className="text-white font-semibold">
                The Stalker is dangerously close!
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quit Game Confirmation Dialog */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            className="fixed bottom-4 right-4 text-orange-400 hover:text-orange-300 bg-black/30 hover:bg-black/50"
          >
            <Home className="h-5 w-5 mr-2" />
            Quit Game
          </Button>
        </SheetTrigger>
        
        <SheetContent side="bottom" className="bg-black/90 border-orange-800">
          <div className="space-y-4 text-center">
            <SheetTitle className="text-orange-400">Quit Game?</SheetTitle>
            <p className="text-orange-200">
              Are you sure you want to quit? Your progress will be lost.
            </p>
            <div className="flex justify-center gap-4">
              <Button
                variant="ghost"
                onClick={() => router.push('/')}
                className="bg-red-900/50 hover:bg-red-800/70 text-orange-100"
              >
                Quit to Menu
              </Button>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  className="bg-orange-900/50 hover:bg-orange-800/70 text-orange-100"
                >
                  Continue Playing
                </Button>
              </SheetTrigger>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Debug Mode Panel (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 p-2 bg-black/90 rounded border border-orange-800 text-xs text-orange-400">
          <pre>
            {JSON.stringify({
              turn: gameState.progress.currentTurn,
              time: gameState.progress.timeOfNight,
              tension: gameState.tension,
              presence: gameState.stalkerPresence,
              fails: gameState.failedRollsCount
            }, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
