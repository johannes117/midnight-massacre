'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skull } from 'lucide-react'
import { motion } from "framer-motion"
import { FloatingGhosts } from "@/components/floating-ghosts"

export function HomeComponent() {
  const router = useRouter()
  const [savedGames] = useState<{ title: string; date: string }[]>([
    { title: "The Haunted Mansion", date: "2023-10-31" },
    { title: "The Whispering Woods", date: "2023-11-01" }
  ])

  const handleStartAdventure = () => {
    router.push('/game?start=true')
  }

  const handleLoadGame = () => {
    console.log('Loading game:', savedGames[0].title)
    router.push('/game')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-900 via-black to-purple-900 text-orange-100 p-4 sm:p-6 md:p-8 flex flex-col items-center justify-center overflow-hidden relative">
      <FloatingGhosts />
      
      <Card className="w-full max-w-2xl bg-black/70 border-orange-800 shadow-lg backdrop-blur-sm overflow-hidden">
        <motion.div
          key="home"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <CardHeader>
            <CardTitle className="text-4xl sm:text-5xl font-bold text-orange-500 text-center">
              Spooky Adventure
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col justify-center items-center p-6 space-y-6">
            <p className="text-lg text-center text-orange-200">
              Embark on a thrilling journey through haunted realms and mysterious landscapes.
              Are you brave enough to face the unknown?
            </p>
            <Button 
              onClick={handleStartAdventure}
              className="text-xl py-4 px-6 bg-orange-700 hover:bg-orange-600 text-white"
            >
              Begin Your Adventure
            </Button>
          </CardContent>
          <CardFooter className="flex justify-center space-x-4 pb-6">
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
      </Card>
    </div>
  )
}
