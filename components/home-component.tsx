'use client'

import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"
import { Skull, Github, Volume2, VolumeX } from 'lucide-react'
import { FloatingGhosts } from "@/components/floating-ghosts"
import { useAudioContext } from '@/components/audio-provider'

export function HomeComponent() {
  const router = useRouter()
  const { isMuted, toggleMute } = useAudioContext()
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-900 via-black to-purple-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <FloatingGhosts />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center z-10"
      >
        <Card className="bg-black/70 border-orange-800 shadow-lg backdrop-blur-sm w-full max-w-md mx-auto">
          <CardContent className="p-6 flex flex-col items-center space-y-8">
            {/* Title Section */}
            <div className="space-y-4">
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              >
                <Skull className="w-16 h-16 text-orange-500 mx-auto" />
              </motion.div>
              <h1 className="text-4xl font-bold text-orange-500 font-horror tracking-wider">
                MIDNIGHT MASSACRE
              </h1>
              <p className="text-orange-300 text-lg">
                Survive The Night. Beat The Mask.
              </p>
            </div>

            {/* Main Menu Options */}
            <div className="w-full space-y-4">
              <Button
                onClick={() => router.push('/game?start=true')}
                className="w-full h-12 bg-orange-900/50 hover:bg-orange-800/70 text-orange-100 font-medium rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-orange-500/30 hover:shadow-lg"
              >
                Start New Game
              </Button>
              
              <Button
                variant="ghost"
                onClick={() => router.push('/load')}
                className="w-full h-12 text-orange-400 hover:text-orange-300 hover:bg-orange-950/50"
              >
                Continue Game
              </Button>
              
              <Button
                variant="ghost"
                onClick={() => router.push('/tutorial')}
                className="w-full h-12 text-orange-400 hover:text-orange-300 hover:bg-orange-950/50"
              >
                How to Play
              </Button>
            </div>

            {/* Warning Text */}
            <div className="text-orange-400/70 text-sm italic border-t border-orange-800/50 pt-4">
              Warning: Contains scenes of horror and tension
            </div>

            {/* Footer Links */}
            <div className="flex justify-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                className="text-orange-400 hover:text-orange-300"
                onClick={toggleMute}
              >
                {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
              </Button>
              
              <a
                href="https://github.com/yourusername/midnight-massacre"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-orange-400 hover:text-orange-300"
                >
                  <Github className="h-6 w-6" />
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Atmospheric Overlay */}
      <div className="fixed inset-0 bg-gradient-radial from-transparent to-black/50 pointer-events-none" />
    </div>
  )
}
