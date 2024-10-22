'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Skull, Volume2, VolumeX, ChevronRight, Menu, ArrowLeft, User, Settings } from 'lucide-react'
import { ScrollArea } from "@/components/ui/scroll-area"
import { motion } from "framer-motion"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { FloatingGhosts } from "@/components/floating-ghosts"
import SpookyLoader from './spooky-loader'

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface StorySegment {
  story: string;
  choices: string[];
}

export function GameComponent() {
  const router = useRouter()
  const [storySegment, setStorySegment] = useState<StorySegment | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [savedGames] = useState<{ title: string; date: string }[]>([
    { title: "The Haunted Mansion", date: "2023-10-31" },
    { title: "The Whispering Woods", date: "2023-11-01" }
  ])
  const [messages, setMessages] = useState<Message[]>([])

  const fetchStorySegment = useCallback(async (currentMessages: Message[]) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/generate-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: currentMessages }),
      });
  
      const data: StorySegment = await response.json();
      
      setStorySegment(data);
      setMessages(prevMessages => [...prevMessages, {
        role: 'assistant',
        content: JSON.stringify(data)
      }]);
    } catch (error) {
      console.error('Error fetching story segment:', error);
      setStorySegment({
        story: 'An error occurred while generating the story. Please try again.',
        choices: ['Try again', 'Start over', 'Return to menu']
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleStartAdventure = useCallback(async () => {
    console.log('Starting adventure')
    const initialMessage: Message = { role: 'user', content: 'Start a new spooky adventure story.' }
    await fetchStorySegment([initialMessage])
  }, [fetchStorySegment])

  useEffect(() => {
    if (messages.length === 0) {
      handleStartAdventure()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleChoice = useCallback(async (choice: string) => {
    console.log('Handling choice:', choice)
    const userMessage: Message = { role: 'user', content: `I choose: ${choice}` }
    const updatedMessages = [...messages, userMessage]
    await fetchStorySegment(updatedMessages)
  }, [messages, fetchStorySegment]);

  const memoizedFloatingGhosts = useMemo(() => <FloatingGhosts />, [])

  const renderChoice = useCallback((choice: string, index: number) => {
    return (
      <Button
        key={index}
        onClick={() => handleChoice(choice)}
        className="w-full h-auto min-h-[3rem] bg-orange-900/50 hover:bg-orange-800/70 text-orange-100 font-medium py-2 px-4 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-102 hover:shadow-orange-500/30 hover:shadow-md text-left flex justify-between items-center"
        disabled={isLoading}
      >
        <span className="line-clamp-2 flex-grow">{choice}</span>
        <ChevronRight className="h-5 w-5 flex-shrink-0 ml-2" />
      </Button>
    );
  }, [handleChoice, isLoading]);

  const renderSavedGame = useCallback((game: { title: string; date: string }, index: number) => (
    <Button
      key={index}
      variant="ghost"
      className="w-full justify-start text-orange-300 hover:text-orange-200 hover:bg-orange-950/50"
      onClick={() => {
        console.log(`Loading game: ${game.title}`)
      }}
    >
      <Skull className="mr-2 h-5 w-5" />
      <div className="text-left">
        <div>{game.title}</div>
        <div className="text-xs text-orange-500">{game.date}</div>
      </div>
    </Button>
  ), []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-900 via-black to-purple-900 text-orange-100 p-4 sm:p-6 md:p-8 flex flex-col items-center justify-center overflow-hidden relative">
      {memoizedFloatingGhosts}
      
      <Card className="w-full max-w-2xl h-[calc(100vh-2rem)] sm:h-auto sm:max-h-[calc(100vh-4rem)] bg-black/70 border-orange-800 shadow-lg backdrop-blur-sm overflow-hidden flex flex-col">
        <motion.div
          key="story"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col h-full"
        >
          <CardContent className="flex flex-col items-center p-6 space-y-6 flex-grow overflow-hidden">
            <ScrollArea className="w-full flex-grow p-4 bg-black/30 rounded-lg shadow-inner border border-orange-800/50">
              {isLoading ? (
                <SpookyLoader />
              ) : (
                <p className="text-lg leading-relaxed text-orange-200">
                  {storySegment?.story}
                </p>
              )}
            </ScrollArea>
            {!isLoading && storySegment && (
              <div className="w-full space-y-4">
                {storySegment.choices.map((choice, index) => renderChoice(choice, index))}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="ghost"
              onClick={() => router.push('/')}
              className="text-orange-400 hover:text-orange-300 bg-black/30 hover:bg-black/50 rounded-full transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Home
            </Button>
          </CardFooter>
        </motion.div>
      </Card>

      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 text-orange-400 hover:text-orange-300 bg-black/30 hover:bg-black/50 rounded-full transition-colors"
        onClick={() => setIsMuted(!isMuted)}
      >
        {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
      </Button>

      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 left-4 text-orange-400 hover:text-orange-300 bg-black/30 hover:bg-black/50 rounded-full transition-colors"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[300px] sm:w-[400px] bg-black/90 border-orange-800" aria-describedby="menu-description">
          <SheetTitle className="text-lg font-semibold text-orange-400 mb-4">Menu</SheetTitle>
          <p id="menu-description" className="sr-only">Game menu containing profile, settings, and saved games</p>
          <nav className="flex flex-col h-full">
            <div className="flex items-center mb-6">
              <User className="mr-2 h-6 w-6 text-orange-400" />
              <h2 className="text-lg font-semibold text-orange-400">Profile</h2>
            </div>
            <div className="flex items-center mb-6">
              <Settings className="mr-2 h-6 w-6 text-orange-400" />
              <h2 className="text-lg font-semibold text-orange-400">Settings</h2>
            </div>
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-orange-400 mb-2">Saved Games</h2>
              <ScrollArea className="h-[50vh]">
                {savedGames.map((game, index) => renderSavedGame(game, index))}
              </ScrollArea>
            </div>
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  )
}
