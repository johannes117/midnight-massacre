'use client'

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import { ArrowLeft, Skull, Clock, Ghost, Heart, Brain, Moon, Shield } from "lucide-react";
import { FloatingParticles } from "@/components/floating-particles";

export default function TutorialComponent() {
  const router = useRouter();
  
  const sections = [
    {
      icon: <Ghost className="w-8 h-8" />,
      title: "The Story",
      content: "You find yourself trapped in a haunted town on Halloween night, being hunted by an unstoppable masked killer known as 'The Stalker'. Your goal is to survive until dawn by making strategic choices, gathering vital items, and managing your survival score through 30 turns of terror."
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: "Time Progression",
      content: "The night is divided into five phases:\n- Dusk: The horror begins (Turns 1-6)\n- Midnight: Darkness deepens (Turns 7-12)\n- Late Night: Peak danger (Turns 13-18)\n- Near Dawn: Desperate hours (Turns 19-24)\n- Dawn Approaches: Final stretch (Turns 25-30)\n\nEach choice advances time by one turn. You must survive all 30 turns to reach dawn!"
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: "Survival Score",
      content: "Your survival score starts at 100 and represents your ability to stay alive. Successful actions increase it, while failures decrease it. If it reaches 0, it's game over. Keep an eye on your score and avoid high-risk actions when it's low."
    },
    {
      icon: <Brain className="w-8 h-8" />,
      title: "Choice Mechanics",
      content: "Each choice comes with:\n- Difficulty Check (DC): The target number you need to succeed\n- Risk Factor: How much survival score you might lose on failure\n- Reward Value: How much survival score you gain on success\n- Type: Combat, Stealth, Escape, or Search - each affected differently by your status and items\n\nChoices become more challenging as the night progresses!"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Status Effects",
      content: "Your condition affects your chances:\n- Being injured makes actions harder\n- Hidden status helps with stealth\n- Being exposed increases difficulty\n- Environmental factors like darkness and noise impact your success chances\n\nManage your status carefully to improve your odds of survival."
    },
    {
      icon: <Moon className="w-8 h-8" />,
      title: "Victory Conditions",
      content: "There are three ways to win:\n1. Survive all 30 turns until dawn (Any survival score)\n2. Confront and defeat The Stalker (Requires weapon and 100+ survival score)\n3. Find an early escape route (Requires key and 80+ survival score)\n\nChoose your strategy carefully based on the items you find and your survival score!"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-900 via-black to-purple-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <FloatingParticles />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl z-10"
      >
        <Card className="bg-black/70 border-orange-800 shadow-lg backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <Skull className="w-8 h-8 text-orange-500" />
              <h1 className="text-3xl font-horror text-orange-500">How To Play</h1>
            </div>

            <ScrollArea className="h-[60vh] pr-4">
              <div className="space-y-6">
                {sections.map((section, index) => (
                  <motion.div
                    key={section.title}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-orange-950/30 p-4 rounded-lg border border-orange-800/50"
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="text-orange-400">
                        {section.icon}
                      </div>
                      <h2 className="text-xl font-semibold text-orange-400">
                        {section.title}
                      </h2>
                    </div>
                    <p className="text-orange-200 whitespace-pre-line">
                      {section.content}
                    </p>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>

            <div className="mt-6 flex justify-between items-center">
              <Button
                onClick={() => router.back()}
                variant="ghost"
                className="text-orange-400 hover:text-orange-300 bg-black/30 hover:bg-black/50"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Menu
              </Button>
              
              <Button
                onClick={() => router.push('/game?start=true')}
                className="bg-orange-900/50 hover:bg-orange-800/70 text-orange-100"
              >
                Start Playing
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}