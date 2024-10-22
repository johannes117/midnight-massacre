'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Ghost, Skull, Settings, Volume2, VolumeX, ChevronRight, Menu, ArrowLeft, User } from 'lucide-react'
import { ScrollArea } from "@/components/ui/scroll-area"
import { motion, AnimatePresence } from "framer-motion"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { FloatingGhosts } from "@/components/floating-ghosts"

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function SpookyAdventureComponent() {
  console.log('Component rendering')

  const [screen, setScreen] = useState('home')
  const [storyText, setStoryText] = useState('')
  const [choices, setChoices] = useState<string[]>([])
  const [isMuted, setIsMuted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [savedGames] = useState<{ title: string; date: string }[]>([
    { title: "The Haunted Mansion", date: "2023-10-31" },
    { title: "The Whispering Woods", date: "2023-11-01" }
  ])
  const [messages, setMessages] = useState<Message[]>([])

  const generateStorySegment = async (currentMessages: Message[]) => {
    console.log('Generating story segment', currentMessages);
    setIsLoading(true);
    try {
      const response = await fetch('/api/generate-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: currentMessages }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to generate story segment: ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      console.log('Received story segment', data);
      
      if (!data.narration || !data.choices) {
        throw new Error('Invalid response format: missing narration or choices');
      }

      setStoryText(data.narration);
      setChoices(data.choices);
      setMessages([...currentMessages, { role: 'assistant', content: JSON.stringify(data) }]);
    } catch (error) {
      console.error('Error generating story segment:', error);
      setStoryText('An error occurred while generating the story. Please try again.');
      setChoices([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartAdventure = useCallback(async () => {
    console.log('Starting adventure')
    setIsLoading(true)
    const initialMessage: Message = { role: 'user', content: 'Start a new spooky adventure story.' }
    await generateStorySegment([initialMessage])
    setScreen('story')
  }, [])

  useEffect(() => {
    console.log('Effect running, screen:', screen, 'messages length:', messages.length)
    if (screen === 'story' && messages.length === 0) {
      handleStartAdventure()
    }
  }, [screen, messages, handleStartAdventure])

  const handleChoice = async (choice: string) => {
    console.log('Handling choice:', choice)
    setIsLoading(true)
    const userMessage: Message = { role: 'user', content: `I choose: ${choice}` }
    const updatedMessages = [...messages, userMessage]
    await generateStorySegment(updatedMessages)
  }

  const handleLoadGame = () => {
    console.log('Loading game:', savedGames[0].title)
    setScreen('story')
  }

  console.log('Rendering, screen:', screen, 'isLoading:', isLoading)

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-900 via-black to-purple-900 text-orange-100 p-4 sm:p-6 md:p-8 flex flex-col items-center justify-center overflow-hidden relative">
      <FloatingGhosts />
      
      <Card className="w-full max-w-2xl bg-black/70 border-orange-800 shadow-lg backdrop-blur-sm overflow-hidden">
        <AnimatePresence mode="wait">
          {screen === 'home' && (
            console.log('Rendering home screen'),
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <CardHeader>
                <CardTitle className="text-5xl font-bold text-orange-500 text-center">
                  Spooky Adventure
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center p-6 space-y-6">
                <p className="text-lg text-center mb-6 text-orange-300">
                  &ldquo;Dare to explore the haunted mansion and uncover its chilling secrets...&rdquo;
                </p>
                <Button 
                  onClick={handleStartAdventure}
                  className="w-64 h-16 text-xl bg-orange-700 hover:bg-orange-600 text-white font-bold rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-orange-500/50 hover:shadow-lg"
                >
                  Begin Your Adventure
                  <Ghost className="ml-2 h-6 w-6" />
                </Button>
              </CardContent>
              <CardFooter className="flex justify-center space-x-4">
                {savedGames.length > 0 && (
                  <Button 
                    variant="outline" 
                    className="text-orange-400 hover:text-orange-300 bg-black/50 border-orange-700 hover:bg-orange-950 transition-colors"
                    onClick={handleLoadGame}
                  >
                    <Skull className="mr-2 h-5 w-5" />
                    Load Game - {savedGames[0].title}
                  </Button>
                )}
              </CardFooter>
            </motion.div>
          )}

          {screen === 'story' && (
            <motion.div
              key="story"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <CardContent className="flex flex-col items-center p-6 space-y-6">
                <ScrollArea className="w-full h-64 p-4 bg-black/30 rounded-lg shadow-inner border border-orange-800/50">
                  {isLoading ? (
                    <Skeleton className="w-full h-full bg-orange-900/30" />
                  ) : (
                    <p className="text-lg leading-relaxed text-orange-200">{storyText}</p>
                  )}
                </ScrollArea>
                <div className="w-full space-y-4">
                  {choices.map((choice, index) => (
                    <Button
                      key={index}
                      onClick={() => handleChoice(choice)}
                      className="w-full h-auto min-h-[3rem] bg-orange-900/50 hover:bg-orange-800/70 text-orange-100 font-medium py-2 px-4 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-102 hover:shadow-orange-500/30 hover:shadow-md text-left flex justify-between items-center"
                      disabled={isLoading}
                    >
                      <span className="line-clamp-2 flex-grow">{choice}</span>
                      <ChevronRight className="h-5 w-5 flex-shrink-0 ml-2" />
                    </Button>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  variant="ghost"
                  onClick={() => setScreen('home')}
                  className="text-orange-400 hover:text-orange-300 bg-black/30 hover:bg-black/50 rounded-full transition-colors"
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Back to Home
                </Button>
              </CardFooter>
            </motion.div>
          )}
        </AnimatePresence>
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
        <SheetContent side="left" className="w-[300px] sm:w-[400px] bg-black/90 border-orange-800">
          <SheetTitle className="text-lg font-semibold text-orange-400 mb-4">Menu</SheetTitle>
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
                {savedGames.map((game, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    className="w-full justify-start text-orange-300 hover:text-orange-200 hover:bg-orange-950/50"
                    onClick={() => {
                      console.log(`Loading game: ${game.title}`)
                      setScreen('story')
                    }}
                  >
                    <Skull className="mr-2 h-5 w-5" />
                    <div className="text-left">
                      <div>{game.title}</div>
                      <div className="text-xs text-orange-500">{game.date}</div>
                    </div>
                  </Button>
                ))}
              </ScrollArea>
            </div>
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  )
}
