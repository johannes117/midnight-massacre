'use client'

import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"
import { Skull, Volume2, VolumeX } from 'lucide-react'
import { FloatingParticles } from "@/components/floating-particles"
import { useAudioContext } from '@/components/audio-provider'

export function HomeComponent() {
  const router = useRouter()
  const { isMuted, toggleMute } = useAudioContext()
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-900 via-black to-purple-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <FloatingParticles />
      
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
                className="w-full h-12 text-orange-400 hover:text-orange-300 hover:bg-orange-950/50 relative"
                disabled
              >
                Continue Game
                <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs bg-orange-500 text-black px-1 py-0.5 rounded">
                  Coming Soon
                </span>
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

            {/* Footer Row */}
            <div className="flex justify-between items-center w-full mt-4">
              {/* Mute Button */}
              <Button
                variant="ghost"
                size="icon"
                className="text-orange-400 hover:text-orange-300"
                onClick={toggleMute}
              >
                {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
              </Button>

              {/* Private Beta Label */}
              <div className="text-orange-400 text-sm font-semibold bg-orange-900/30 px-2 py-1 rounded-full">
                Private Beta
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Atmospheric Overlay */}
      <div className="fixed inset-0 bg-gradient-radial from-transparent to-black/50 pointer-events-none" />
    </div>
  )
}
