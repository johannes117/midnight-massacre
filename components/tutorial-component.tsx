'use client'

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import { ArrowLeft, Skull, Key, Sword, Ghost, Heart, Brain } from "lucide-react";
import { FloatingParticles } from "@/components/floating-particles";

export default function TutorialComponent() {
  const router = useRouter();
  
  const sections = [
    {
      icon: <Ghost className="w-8 h-8" />,
      title: "The Story",
      content: "You find yourself trapped in a small town on Halloween night, being hunted by an unstoppable masked killer known as 'The Stalker'. Your goal is to survive until dawn by either escaping or confronting the killer."
    },
    {
      icon: <Brain className="w-8 h-8" />,
      title: "Making Choices",
      content: "At each moment in the story, you'll be presented with three choices. Choose carefully - your decisions affect your survival chances and can lead to different outcomes. Some choices may require specific items or lead to deadly consequences."
    },
    {
      icon: <Key className="w-8 h-8" />,
      title: "Finding Items",
      content: "Throughout your journey, you can find important items like weapons and keys. These items may be crucial for survival and can unlock new choices. Keep track of your inventory in the menu."
    },
    {
      icon: <Sword className="w-8 h-8" />,
      title: "Confronting The Stalker",
      content: "While running and hiding are often wise choices, you may eventually need to confront The Stalker. This is only possible if you've found the right items and made the right preparations."
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: "Survival Tips",
      content: "- Pay attention to your surroundings\n- Think before you act\n- Look for items that might help\n- Keep track of The Stalker's movements\n- Sometimes hiding is better than running"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-900 via-black to-purple-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <FloatingParticles />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl z-10"
      >
        <Card className="bg-black/70 border-red-800 shadow-lg backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <Skull className="w-8 h-8 text-red-500" />
              <h1 className="text-3xl font-horror text-red-500">How To Play</h1>
            </div>

            <ScrollArea className="h-[60vh] pr-4">
              <div className="space-y-6">
                {sections.map((section, index) => (
                  <motion.div
                    key={section.title}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-red-950/30 p-4 rounded-lg border border-red-800/50"
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="text-red-400">
                        {section.icon}
                      </div>
                      <h2 className="text-xl font-semibold text-red-400">
                        {section.title}
                      </h2>
                    </div>
                    <p className="text-red-200 whitespace-pre-line">
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
                className="text-red-400 hover:text-red-300 bg-black/30 hover:bg-black/50"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Menu
              </Button>
              
              <Button
                onClick={() => router.push('/game?start=true')}
                className="bg-red-900/50 hover:bg-red-800/70 text-red-100"
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